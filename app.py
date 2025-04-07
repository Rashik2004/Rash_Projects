from flask import Flask, request, jsonify, render_template, send_from_directory, flash, redirect, url_for
from werkzeug.utils import secure_filename
import os
from resume_analyzer import ResumeAnalyzer
from config import Config
import logging
import re

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_for_resume_analyzer')  # For flash messages
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize the resume analyzer
resume_analyzer = ResumeAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/resume')
def resume():
    return render_template('resume.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    logger.info('Received request to analyze resume')

    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            logger.error('No file part in request')
            return jsonify({'error': 'No file part'})

        file = request.files['file']

        # Check if file was selected
        if file.filename == '':
            logger.error('No file selected')
            return jsonify({'error': 'No file selected'})

        # Check file extension
        allowed_extensions = {'pdf', 'docx'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''

        if file_ext not in allowed_extensions:
            logger.error(f'File with extension {file_ext} not allowed')
            return jsonify({'error': f'File type .{file_ext} not allowed. Please upload PDF or DOCX files'})

        # Use the resume_analyzer directly with the file object
        # No need to save/extract separately
        analysis_result = resume_analyzer.analyze(file)

        return jsonify(analysis_result)

    except Exception as e:
        logger.error(f'Error analyzing resume: {str(e)}', exc_info=True)
        return jsonify({'error': f'Error analyzing resume: {str(e)}'})

# Serve static files directly when accessing HTML files
@app.route('/templates/<path:filename>')
def serve_template_directly(filename):
    return send_from_directory('templates', filename)

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if request.method == 'POST':
        try:
            # Get Gemini API key
            gemini_api_key = request.form.get('gemini_api_key', '')

            # Get AI usage setting
            use_ai = request.form.get('use_ai') == 'on'

            # Set AI model (always Gemini Pro)
            ai_model = "gemini-pro"
            ai_provider = "gemini"

            # Test API key if AI is enabled
            api_error = None
            api_error_detail = None

            if use_ai and gemini_api_key:
                # Test Gemini API
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=gemini_api_key)
                    model = genai.GenerativeModel(ai_model)
                    response = model.generate_content("Test")
                except Exception as e:
                    error_msg = str(e).lower()
                    if "api key" in error_msg or "invalid" in error_msg:
                        api_error = "Invalid Gemini API Key"
                        api_error_detail = "The API key provided appears to be invalid. Please check your key and try again."
                    else:
                        api_error = "Gemini API Error"
                        api_error_detail = f"Error connecting to Gemini: {str(e)}"
                    use_ai = False
            elif use_ai and not gemini_api_key:
                api_error = "Missing API Key"
                api_error_detail = "Please provide a Gemini API key"
                use_ai = False

            # Update config file
            with open('config.py', 'r') as file:
                config_content = file.read()

            # Update provider (always Gemini)
            config_content = re.sub(r'AI_PROVIDER = ".*?"', f'AI_PROVIDER = "gemini"', config_content)

            # Update API key
            config_content = re.sub(r'GEMINI_API_KEY = ".*?"', f'GEMINI_API_KEY = "{gemini_api_key}"', config_content)

            # Update USE_AI_ANALYSIS flag
            config_content = re.sub(r'USE_AI_ANALYSIS = (?:True|False)', f'USE_AI_ANALYSIS = {use_ai}', config_content)

            # Update AI model
            config_content = re.sub(r'AI_MODEL = ".*?"', f'AI_MODEL = "gemini-pro"', config_content)

            with open('config.py', 'w') as file:
                file.write(config_content)

            # Restart the app to apply changes
            if use_ai and not api_error:
                # Reinitialize the resume analyzer
                global resume_analyzer
                resume_analyzer = ResumeAnalyzer()
                flash('Settings updated successfully!', 'success')
            elif api_error:
                flash(f'Settings saved, but AI analysis is disabled: {api_error}', 'error')
            else:
                flash('Settings updated successfully!', 'success')

        except Exception as e:
            logger.error(f'Error updating settings: {str(e)}', exc_info=True)
            flash(f'Error updating settings: {str(e)}', 'error')

        return redirect(url_for('settings'))

    # GET request - show settings form
    try:
        with open('config.py', 'r') as file:
            config_content = file.read()

        # Extract current settings
        gemini_api_key_match = re.search(r'GEMINI_API_KEY = "(.*?)"', config_content)
        use_ai_match = re.search(r'USE_AI_ANALYSIS = (True|False)', config_content)

        # Extract values or set defaults
        gemini_api_key = gemini_api_key_match.group(1) if gemini_api_key_match else ""
        use_ai = use_ai_match.group(1) == 'True' if use_ai_match else False
        ai_provider = "gemini"
        ai_model = "gemini-pro"

        # Check if API is configured
        ai_configured = False
        api_error = None
        api_error_detail = None

        if use_ai and gemini_api_key:
            # Test Gemini
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel(ai_model)
                response = model.generate_content("Test")
                ai_configured = True
            except Exception as e:
                error_msg = str(e).lower()
                if "api key" in error_msg or "invalid" in error_msg:
                    api_error = "Invalid Gemini API Key"
                    api_error_detail = "The API key provided appears to be invalid. Please check your key and try again."
                else:
                    api_error = "Gemini API Error"
                    api_error_detail = f"Error connecting to Gemini: {str(e)}"

        return render_template(
            'settings.html',
            gemini_api_key=gemini_api_key,
            ai_provider=ai_provider,
            use_ai=use_ai,
            ai_model=ai_model,
            ai_configured=ai_configured,
            api_error=api_error,
            api_error_detail=api_error_detail
        )
    except Exception as e:
        logger.error(f'Error loading settings: {str(e)}', exc_info=True)
        flash(f'Error loading settings: {str(e)}', 'error')
        return render_template('settings.html', gemini_api_key="", ai_provider="gemini", use_ai=False, ai_model="gemini-pro")

if __name__ == '__main__':
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    print("Starting server on port 5002...")
    app.run(debug=True, port=5002)
