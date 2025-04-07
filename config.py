class Config:
    UPLOAD_FOLDER = 'uploads'
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # AI API Configuration
    AI_PROVIDER = "gemini"  # Only using Gemini for now

    # OpenAI Configuration - Currently disabled
    OPENAI_API_KEY = ""

    # HuggingFace Configuration - Currently disabled
    HUGGINGFACE_API_KEY = ""

    # Gemini Configuration
    GEMINI_API_KEY = "AIzaSyAnEdXoGh8X7l2y3bqe-LWlvKMK54OlpVo"  # Add your Gemini API key here

    USE_AI_ANALYSIS = True  # Set to True to enable AI-powered analysis

    # Analysis options
    AI_MODEL = "models/gemini-1.5-pro-latest"  # Updated to use the latest model format
    MAX_TOKENS = 1000  # Maximum tokens for API response
