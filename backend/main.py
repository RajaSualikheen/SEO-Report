from fastapi import FastAPI # Crucial: Ensure FastAPI is imported
from fastapi.middleware.cors import CORSMiddleware
from routers.seo_report import router as seo_report_router
from fastapi.exception_handlers import http_exception_handler # NEW
from starlette.exceptions import HTTPException # NEW
from starlette.requests import Request # NEW
from starlette.responses import Response as StarletteResponse # NEW: Import Response from Starlette if needed for type hinting


app = FastAPI() # Line 3, where the error occurred

# Configure CORS Middleware (ONLY ONE CORS CONFIG)
origins = [
    "http://localhost:5173",  # Your frontend origin
    "http://127.0.0.1:5173",  # Alternative localhost
    "https://seoanalyzerauth.web.app",  # Your production frontend
    "http://localhost:3000", # Added this back, assuming you might use it
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"] # Good to have for dev/troubleshooting
)

# Global Exception Handler to add CORS headers to error responses
@app.exception_handler(HTTPException)
async def cors_exception_handler(request: Request, exc: HTTPException):
    response = await http_exception_handler(request, exc) # Use FastAPI's default handler first
    # Then, apply CORS headers to the error response
    
    # Dynamically set Access-Control-Allow-Origin based on request origin
    request_origin = request.headers.get("origin")
    if request_origin and request_origin in origins:
         response.headers["Access-Control-Allow-Origin"] = request_origin
    else:
        # Fallback for unexpected origins or if origin header is missing
        # For 'allow_credentials=True', you cannot use '*'
        # For development, you might default to one of your allowed origins if request.headers.get("origin") is not present
        response.headers["Access-Control-Allow-Origin"] = origins[0] # Default to the first allowed origin

    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Expose-Headers"] = "*"
    return response

# Include routers
app.include_router(seo_report_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the SEO Analyzer API!"}