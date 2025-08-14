# Evidence-Based Decision Documentation Template

## Purpose
This template ensures all technical and product decisions are supported with concrete evidence, improving decision quality and enabling future reviews.

## Template Structure

### Decision Title
Brief, descriptive title of the decision made.

### Context
- What problem or opportunity triggered this decision?
- What constraints or requirements existed?
- Who were the stakeholders involved?

### Options Considered
List all alternatives that were evaluated:

1. **Option A**: Description
   - Pros: List advantages
   - Cons: List disadvantages
   - Evidence: Supporting data/research

2. **Option B**: Description
   - Pros: List advantages  
   - Cons: List disadvantages
   - Evidence: Supporting data/research

### Decision Made
State the chosen option clearly.

### Supporting Evidence
Document the specific evidence that supported this decision:

#### Quantitative Evidence
- Performance metrics
- Cost analysis
- User analytics
- Technical benchmarks
- A/B test results

#### Qualitative Evidence
- User feedback quotes
- Expert opinions
- Code review comments
- Documentation references
- Industry best practices

#### Primary Sources
- Direct quotes from stakeholders
- Exact error messages or logs
- Specific user complaints or requests
- Regulatory requirements

### Implementation Impact
- What changes were required?
- Resource allocation needed
- Timeline implications
- Risk mitigation steps

### Success Criteria
How will we measure if this decision was correct?
- Specific metrics to track
- Timeline for evaluation
- Rollback criteria if needed

### Review Date
When should this decision be re-evaluated?

## Usage Guidelines

### When to Document
Document decisions that:
- Affect system architecture
- Impact user experience significantly
- Require substantial resource investment
- Set technical standards or patterns
- Influence product direction

### Evidence Quality Standards
- **Direct over indirect**: Prefer primary sources over interpretations
- **Specific over general**: Use exact quotes, numbers, and references
- **Recent over old**: Prioritize current data and feedback
- **Multiple sources**: Cross-verify important evidence
- **Traceable**: Include links, timestamps, and attribution

### Maintenance
- Update evidence when new information becomes available
- Archive outdated decisions with links to newer ones
- Regular review of active decisions and their outcomes

## Example Applications

### Technical Decisions
- Framework selection (React vs Vue)
- Database choices (SQL vs NoSQL)
- API design patterns (REST vs GraphQL)
- Infrastructure decisions (cloud providers)

### Product Decisions
- Feature prioritization
- User interface changes
- Business logic requirements
- Integration strategies

### Quality Assurance
- Testing strategies
- Code review processes
- Deployment procedures
- Monitoring approaches

## Integration with Development Process

### Code Reviews
- Reference decision documents in PR descriptions
- Ensure implementations align with documented decisions
- Update evidence when implementation reveals new insights

### Product Planning
- Base roadmap priorities on documented evidence
- Track decision outcomes in sprint retrospectives
- Use evidence to justify scope changes

### Architecture Reviews
- Validate technical decisions against documented evidence
- Update architectural decisions when constraints change
- Maintain decision history for future reference