# Generic router module for the Databricks app template
# Add your FastAPI routes here

from fastapi import APIRouter

from .user import router as user_router
from .notes import router as notes_router
from .debug import router as debug_router

router = APIRouter()
router.include_router(user_router, prefix='/user', tags=['user'])
router.include_router(notes_router, prefix='/notes', tags=['notes'])
router.include_router(debug_router, prefix='/debug', tags=['debug'])
