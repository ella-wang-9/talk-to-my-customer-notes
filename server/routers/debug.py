from fastapi import APIRouter
from databricks.sdk import WorkspaceClient

router = APIRouter()

@router.get("/debug-data-exploration")
async def debug_data_exploration():
    """Debug the data to understand why the query returns no results."""
    try:
        w = WorkspaceClient()
        
        # Get first running warehouse
        warehouses = list(w.warehouses.list())
        warehouse_id = None
        for warehouse in warehouses:
            if warehouse.state and warehouse.state.value == "RUNNING":
                warehouse_id = warehouse.id
                break
        
        if not warehouse_id:
            return {"error": "No running warehouse available"}
        
        queries = []
        results = {}
        
        # Query 1: Check what names are available in workday
        query1 = """
        SELECT DISTINCT wd.dim_employee_name_latest 
        FROM metric_store.dim_workday_attributes_latest wd
        WHERE wd.dim_employee_name_latest ILIKE '%ella%' 
           OR wd.dim_employee_name_latest ILIKE '%wang%'
        LIMIT 10
        """
        queries.append(("Available names with 'ella' or 'wang'", query1))
        
        # Query 2: Check recent customer notes (any name)
        query2 = """
        SELECT 
            wd.dim_employee_name_latest AS Name,
            DATE(cn.CreatedDate) AS Date,
            cn.Subject__c AS Subject
        FROM main.sfdc_bronze.customer_notes__c AS cn
        LEFT JOIN main.sfdc_bronze.user u ON cn.OwnerId = u.Id
        LEFT JOIN metric_store.dim_workday_attributes_latest wd ON u.Email = wd.dim_employee_email_latest
        WHERE cn.TLDR__c IS NOT NULL
          AND isnotnull(wd.dim_employee_name_latest)
          AND DATE(cn.CreatedDate) >= '2025-01-01'
          AND u.processDate = (SELECT MAX(processDate) FROM main.sfdc_bronze.user)
          AND cn.processDate = (SELECT MAX(processDate) FROM main.sfdc_bronze.customer_notes__c)
        ORDER BY cn.CreatedDate DESC
        LIMIT 10
        """
        queries.append(("Recent customer notes (2025+)", query2))
        
        # Query 3: Check if Ella Wang exists with different criteria
        query3 = """
        SELECT 
            wd.dim_employee_name_latest AS Name,
            wd.dim_employee_email_latest AS Email,
            wd.dim_estaff_latest AS Estaff
        FROM metric_store.dim_workday_attributes_latest wd
        WHERE (wd.dim_employee_name_latest ILIKE '%ella%' AND wd.dim_employee_name_latest ILIKE '%wang%')
           OR wd.dim_employee_email_latest ILIKE '%ella.wang%'
        LIMIT 5
        """
        queries.append(("Ella Wang in workday data", query3))
        
        # Query 4: Check date ranges in customer notes
        query4 = """
        SELECT 
            MIN(DATE(cn.CreatedDate)) as earliest_date,
            MAX(DATE(cn.CreatedDate)) as latest_date,
            COUNT(*) as total_notes
        FROM main.sfdc_bronze.customer_notes__c AS cn
        WHERE cn.TLDR__c IS NOT NULL
          AND cn.processDate = (SELECT MAX(processDate) FROM main.sfdc_bronze.customer_notes__c)
        """
        queries.append(("Date range of customer notes", query4))
        
        # Execute all queries
        for query_name, query in queries:
            try:
                result = w.statement_execution.execute_statement(
                    statement=query,
                    warehouse_id=warehouse_id
                )
                
                rows = []
                if result.result and result.result.data_array:
                    rows = result.result.data_array
                
                results[query_name] = {
                    "row_count": len(rows),
                    "sample_rows": rows[:5] if rows else [],
                    "query": query
                }
                
            except Exception as e:
                results[query_name] = {
                    "error": str(e),
                    "query": query
                }
        
        return {
            "warehouse_id": warehouse_id,
            "results": results
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }