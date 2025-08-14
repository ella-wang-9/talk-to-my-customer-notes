from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import re
import html

router = APIRouter()

# Data Models
class CustomerNote(BaseModel):
    CustomerName: str
    ProductManagerName: str
    NoteID: str  # Changed to string to handle Salesforce IDs
    Date: str  # ISO date (YYYY-MM-DD)
    Subject: str
    NoteContent: str  # HTML (includes TLDR + full note text concatenated)
    CleanedNoteContent: str = ""  # plain text; initialize as ""

class DateRange(BaseModel):
    startMonth: str  # YYYY-MM
    endMonth: str    # YYYY-MM

class NotesRequest(BaseModel):
    names: List[str]  # Changed from single name to list of names
    dateRange: DateRange
    projectDescription: str

class RelevanceFilter(BaseModel):
    notes: List[CustomerNote]
    projectDescription: str

class QARequest(BaseModel):
    notes: List[CustomerNote]
    questions: List[str]

class QAAnswer(BaseModel):
    answer: str  # "Yes", "No", or "-"
    evidence: List[str]

class QAResult(BaseModel):
    noteId: str  # Changed to string to handle Salesforce IDs
    customerName: str
    date: str
    answers: List[QAAnswer]

# HTML to Text transformation
def strip_html_to_text(html_content: str) -> str:
    """
    Remove all HTML tags, scripts, and styles from HTML content.
    Returns cleaned plain text.
    """
    if not html_content:
        return ""
    
    # Remove script and style elements completely
    clean_text = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
    clean_text = re.sub(r'<style[^>]*>.*?</style>', '', clean_text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove HTML tags
    clean_text = re.sub(r'<[^>]+>', '', clean_text)
    
    # Decode HTML entities
    clean_text = html.unescape(clean_text)
    
    # Clean up whitespace
    clean_text = re.sub(r'\s+', ' ', clean_text)
    clean_text = clean_text.strip()
    
    return clean_text

def transform_html_to_text(notes: List[CustomerNote]) -> List[CustomerNote]:
    """
    Transform a list of CustomerNote objects by cleaning HTML from NoteContent
    and populating CleanedNoteContent with plain text.
    """
    result = []
    for note in notes:
        note_dict = note.dict()
        note_dict["CleanedNoteContent"] = strip_html_to_text(note.NoteContent)
        result.append(CustomerNote(**note_dict))
    return result

@router.get("/pm-names")
async def get_pm_names() -> List[str]:
    """
    Fetch list of Product Manager names from customer notes data.
    """
    try:
        from databricks.sdk import WorkspaceClient
        
        # Initialize Databricks client
        w = WorkspaceClient()
        
        # Get first running warehouse
        warehouses = list(w.warehouses.list())
        warehouse_id = None
        for warehouse in warehouses:
            if warehouse.state and warehouse.state.value == "RUNNING":
                warehouse_id = warehouse.id
                break
        
        if not warehouse_id:
            raise Exception("No running warehouse available")
        
        # First check if we have any customer notes data
        count_query = """
        SELECT COUNT(*) as note_count
        FROM main.sfdc_bronze.customer_notes__c
        WHERE TLDR__c IS NOT NULL
        """
        
        print(f"Checking customer notes count: {count_query}")
        
        count_result = w.statement_execution.execute_statement(
            statement=count_query,
            warehouse_id=warehouse_id
        )
        
        note_count = 0
        if count_result.result and count_result.result.data_array:
            note_count = count_result.result.data_array[0][0] if count_result.result.data_array[0] else 0
        
        print(f"Found {note_count} customer notes with TLDR")
        
        if note_count == 0:
            print("No customer notes found, returning empty list")
            return []
        
        # Filter for actual Product Manager names using workday attributes
        sql_query = """
        SELECT wd.dim_employee_name_latest AS Name
        FROM main.metric_store.dim_workday_attributes_latest wd
        WHERE wd.dim_estaff_latest ILIKE "%conway%" 
        AND wd.dim_business_title_latest ILIKE "%product%" 
        AND wd.dim_business_title_latest NOT ILIKE '%design%'
        AND isnotnull(wd.dim_employee_name_latest)
        ORDER BY wd.dim_employee_name_latest
        """
        
        print(f"Executing PM names query: {sql_query}")
        
        # Execute SQL query
        result = w.statement_execution.execute_statement(
            statement=sql_query,
            warehouse_id=warehouse_id
        )
        
        # Parse results into list of names
        names = []
        if result.result and result.result.data_array:
            print(f"Found {len(result.result.data_array)} rows from PM names query")
            for row in result.result.data_array:
                if len(row) >= 1 and row[0] is not None:
                    names.append(str(row[0]))
                    print(f"Added PM name: {row[0]}")
        else:
            print("No result data from PM names query")
        
        print(f"Returning {len(names)} PM names: {names}")
        return names
        
    except Exception as e:
        print(f"Error fetching PM names: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        # Return empty list on error
        return []

@router.post("/fetch-notes")
async def fetch_customer_notes(request: NotesRequest) -> List[CustomerNote]:
    """
    Fetch customer notes filtered by name and date range using Databricks SQL.
    """
    try:
        from databricks.sdk import WorkspaceClient
        
        # Initialize Databricks client
        w = WorkspaceClient()
        
        # Get first running warehouse
        warehouses = list(w.warehouses.list())
        warehouse_id = None
        for warehouse in warehouses:
            if warehouse.state and warehouse.state.value == "RUNNING":
                warehouse_id = warehouse.id
                break
        
        if not warehouse_id:
            raise Exception("No running warehouse available")
        
        # Execute separate queries for each PM name to ensure reliable results
        all_notes = []
        seen_note_ids = set()  # To avoid duplicates
        
        for name in request.names:
            sql_query = f"""
            SELECT
             wd.dim_employee_name_latest AS Name,
             cn.id AS NoteID,
             DATE(cn.CreatedDate) AS Date,
             a.dim_canonical_customer_name AS Customer_Name,
             cn.Subject__c AS Subject,
             CONCAT_WS(' ', cn.TLDR__c, cn.Description__c) AS Note_Content
            FROM
             main.sfdc_bronze.customer_notes__c AS cn
             LEFT JOIN main.metric_store.dim_customer_attributes_latest AS a
               ON cn.account__c = a.dim_salesforce_account_id
             LEFT JOIN main.sfdc_bronze.user u
               ON cn.OwnerId = u.Id
             LEFT JOIN main.metric_store.dim_workday_attributes_latest wd
               ON u.Email = wd.dim_employee_email_latest
            WHERE
             cn.TLDR__c IS NOT NULL
             AND isnotnull(wd.dim_employee_name_latest)
             AND wd.dim_employee_name_latest ILIKE '%{name}%'
             AND DATE(cn.CreatedDate) BETWEEN '{request.dateRange.startMonth}-01' 
                 AND LAST_DAY('{request.dateRange.endMonth}-01')
             AND u.processDate = (
               SELECT MAX(processDate)
               FROM main.sfdc_bronze.user
             )
             AND cn.processDate = (
               SELECT MAX(processDate)
               FROM main.sfdc_bronze.customer_notes__c
             )
            ORDER BY cn.CreatedDate DESC
            """
            
            print(f"Executing query for PM: {name}")
            print(f"SQL: {sql_query}")
            
            # Execute SQL query for this PM
            result = w.statement_execution.execute_statement(
                statement=sql_query,
                warehouse_id=warehouse_id
            )
            
            # Parse results for this PM
            if result.result and result.result.data_array:
                print(f"Found {len(result.result.data_array)} notes for {name}")
                for row in result.result.data_array:
                    if len(row) >= 6 and row[1] is not None:  # Skip rows without NoteID
                        note_id = str(row[1])
                        if note_id not in seen_note_ids:  # Avoid duplicates
                            seen_note_ids.add(note_id)
                            all_notes.append(CustomerNote(
                                CustomerName=row[3] or "Unknown Customer",
                                ProductManagerName=row[0] or "Unknown PM",
                                NoteID=note_id,
                                Date=str(row[2]) if row[2] else "",
                                Subject=row[4] or "",
                                NoteContent=row[5] or "",
                                CleanedNoteContent=""
                            ))
            else:
                print(f"No notes found for {name}")
        
        # Sort all notes by date descending
        all_notes.sort(key=lambda x: x.Date, reverse=True)
        
        # If no notes found, return empty list
        if len(all_notes) == 0:
            names_str = ", ".join(request.names)
            print(f"No notes found for {names_str} in date range {request.dateRange.startMonth} to {request.dateRange.endMonth}")
            return []
            
        return all_notes
        
    except Exception as e:
        print(f"Error executing SQL query: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        # Return empty list on error - frontend will handle gracefully
        return []


@router.get("/test-sql")
async def test_sql():
    """Test SQL execution and return debug info."""
    try:
        from databricks.sdk import WorkspaceClient
        
        w = WorkspaceClient()
        
        # List warehouses
        warehouses = list(w.warehouses.list())
        warehouse_info = [{"id": wh.id, "name": wh.name, "state": wh.state.value if wh.state else None} for wh in warehouses]
        
        # Try a simple query first
        if warehouses:
            warehouse_id = warehouses[0].id
            simple_query = "SELECT 1 as test"
            
            result = w.statement_execution.execute_statement(
                statement=simple_query,
                warehouse_id=warehouse_id
            )
            
            return {
                "warehouses": warehouse_info,
                "test_query_result": result.result.data_array if result.result else None,
                "status": "success"
            }
        else:
            return {
                "warehouses": warehouse_info,
                "error": "No warehouses found"
            }
            
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@router.post("/transform-notes")
async def transform_notes(notes: List[CustomerNote]) -> List[CustomerNote]:
    """
    Transform HTML content to plain text for all notes.
    """
    return transform_html_to_text(notes)

@router.post("/filter-relevance")
async def filter_relevance(request: RelevanceFilter) -> List[CustomerNote]:
    """
    Filter notes using Gemini for relevance to project description.
    Uses Foundation Model Serving to call Gemini.
    """
    try:
        from databricks.sdk import WorkspaceClient
        import json
        
        # Initialize Databricks client
        w = WorkspaceClient()
        
        # Transform notes first to get cleaned content
        transformed_notes = transform_html_to_text(request.notes)
        relevant_notes = []
        
        for note in transformed_notes:
            # Gemini prompt for relevance filtering
            prompt = f"""System Instruction:
You are given a project description and the subject and plain-text content of a customer note. Determine whether the note is relevant to the project description. A note is relevant if it contains information about the same product, feature, customer need, or context that could directly inform or influence the project. If entirely unrelated, it is not relevant.
Respond with only:
"Yes" or "No"

User Input:
Project description:
{request.projectDescription}

Customer note subject:
{note.Subject}

Customer note content:
{note.CleanedNoteContent}"""

            try:
                # Import proper classes for chat models
                from databricks.sdk.service.serving import ChatMessage, ChatMessageRole
                
                # Create proper ChatMessage objects
                messages = [
                    ChatMessage(
                        role=ChatMessageRole.USER,
                        content=prompt
                    )
                ]
                
                # Call Foundation Model Serving with proper format
                response = w.serving_endpoints.query(
                    name="databricks-claude-3-7-sonnet",
                    messages=messages,
                    max_tokens=10,
                    temperature=0.0
                )
                
                # Parse response using object access
                if response and response.choices and len(response.choices) > 0:
                    content = response.choices[0].message.content.strip()
                    print(f"LLM relevance decision for note {note.NoteID}: '{content}'")
                    if "Yes" in content:
                        relevant_notes.append(note)
                else:
                    print(f"No response from LLM for note {note.NoteID}")
                    relevant_notes.append(note)  # Include on no response
            except Exception as e:
                print(f"Error calling Gemini for note {note.NoteID}: {e}")
                # Include note if API call fails to avoid losing data
                relevant_notes.append(note)
        
        return relevant_notes
        
    except Exception as e:
        print(f"Error in relevance filtering: {e}")
        # Return all notes transformed if filtering fails
        return transform_html_to_text(request.notes)

@router.post("/answer-questions")
async def answer_questions(request: QARequest) -> List[QAResult]:
    """
    Answer yes/no questions for each note using Gemini.
    Uses Foundation Model Serving to call Gemini with strict JSON output.
    """
    try:
        from databricks.sdk import WorkspaceClient
        import json
        
        # Initialize Databricks client
        w = WorkspaceClient()
        
        results = []
        
        for note in request.notes:
            answers = []
            
            for question in request.questions:
                # Gemini prompt for Q&A with strict JSON output
                prompt = f"""System Instruction:
You are given a customer note's subject and its plain-text content. You will be asked ONE question about the note.

EVIDENCE-BASED DECISION MAKING FRAMEWORK:
You must base every decision on concrete evidence from the note content. Follow these principles:
- Direct evidence over interpretation: Use exact quotes, not your understanding
- Specific over general: Reference precise statements, not broad themes
- Traceable sources: Every answer must be tied to specific text in the note
- Multiple verification: Cross-check evidence quality before making decisions

CRITICAL CONFIDENCE AND EVIDENCE RULES:
- Be proactive in returning "Maybe" when you are not confident in your answer
- For "Yes" responses: MUST provide direct, highly relevant supporting evidence
- For "Maybe" responses: MUST provide relevant quotes that show ambiguity or partial relevance
- For "No" responses: Provide evidence when available that contradicts or shows absence
- Only include quotes that are clearly and directly related to the question
- Prefer fewer, high-quality quotes over many tangential ones
- Be very confident that each provided quote is relevant to the question
- Prioritize precision over quantity in evidence selection

Rules:
- Output strictly in JSON with keys: answer, evidence.
- answer must be one of: "Yes", "No", "Maybe", or "-"
  - "Yes": You are confident the answer is yes with strong supporting evidence
  - "No": You are confident the answer is no (with contradictory evidence if available)
  - "Maybe": You are uncertain because evidence is ambiguous, incomplete, or only partially relevant
  - "-": The question does not apply to this note
- evidence must be an array of strings, each a direct, exact quote from the note that clearly supports the answer (no paraphrasing)
- For "Yes" answers: evidence is REQUIRED and must be highly relevant to the specific question
- For "Maybe" answers: evidence is REQUIRED showing the ambiguous or partially relevant content
- For "No" answers: evidence is optional but preferred when available
- For "-" answers: evidence must be []
- No extra commentary outside the JSON.

User Input:
Customer note subject:
{note.Subject}

Customer note content:
{note.CleanedNoteContent}

Question:
{question}

Expected Output (JSON only):
{{
  "answer": "Yes" | "No" | "Maybe" | "-",
  "evidence": [
    "Exact quote 1 from note",
    "Exact quote 2 from note"
  ]
}}"""

                try:
                    # Import proper classes for chat models
                    from databricks.sdk.service.serving import ChatMessage, ChatMessageRole
                    
                    # Create proper ChatMessage objects
                    messages = [
                        ChatMessage(
                            role=ChatMessageRole.USER,
                            content=prompt
                        )
                    ]
                    
                    # Call Foundation Model Serving with proper format
                    response = w.serving_endpoints.query(
                        name="databricks-claude-3-7-sonnet",
                        messages=messages,
                        max_tokens=500,
                        temperature=0.0
                    )
                    
                    # Parse response using object access
                    if response and response.choices and len(response.choices) > 0:
                        response_text = response.choices[0].message.content.strip()
                        print(f"LLM Q&A response for note {note.NoteID}, question '{question}': '{response_text}'")
                    else:
                        response_text = ""
                        print(f"No LLM response for note {note.NoteID}, question '{question}'")
                        
                    if response_text:
                        try:
                            # Clean response text by removing markdown code blocks
                            clean_response = response_text
                            if clean_response.startswith("```json"):
                                clean_response = clean_response[7:]  # Remove ```json
                            if clean_response.endswith("```"):
                                clean_response = clean_response[:-3]  # Remove ```
                            clean_response = clean_response.strip()
                            
                            # Try to parse JSON response
                            qa_data = json.loads(clean_response)
                            answers.append(QAAnswer(
                                answer=qa_data.get("answer", "-"),
                                evidence=qa_data.get("evidence", [])
                            ))
                        except json.JSONDecodeError:
                            # Fallback parsing if JSON is malformed
                            answer = "-"
                            if "Yes" in response_text:
                                answer = "Yes"
                            elif "No" in response_text:
                                answer = "No"
                            elif "Maybe" in response_text:
                                answer = "Maybe"
                            
                            answers.append(QAAnswer(
                                answer=answer,
                                evidence=[]
                            ))
                    else:
                        # Empty response text
                        answers.append(QAAnswer(answer="-", evidence=[]))
                        
                except Exception as e:
                    print(f"Error calling Gemini for question '{question}' on note {note.NoteID}: {e}")
                    answers.append(QAAnswer(answer="-", evidence=[]))
            
            results.append(QAResult(
                noteId=note.NoteID,
                customerName=note.CustomerName,
                date=note.Date,
                answers=answers
            ))
        
        return results
        
    except Exception as e:
        print(f"Error in Q&A processing: {e}")
        # Return placeholder results on error
        results = []
        for note in request.notes:
            answers = [QAAnswer(answer="-", evidence=[]) for _ in request.questions]
            results.append(QAResult(
                noteId=note.NoteID,
                customerName=note.CustomerName,
                date=note.Date,
                answers=answers
            ))
        return results