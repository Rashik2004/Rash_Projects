# Resume Analyzer

A web application that analyzes resumes and provides feedback on formatting, grammar, and ATS compatibility using AI-powered insights from Google's Gemini API.

## Features

- Upload and analyze PDF and DOCX resumes
- Detailed formatting analysis with suggestions
- Grammar and writing style feedback
- ATS compatibility scoring
- AI-powered insights powered by Google Gemini API
- Dark/light mode toggle
- Responsive UI design for all devices

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/resume-analyzer.git
cd resume-analyzer
```

2. Install required packages:

```bash
pip3 install -r requirements.txt
```

3. Set up your Gemini API key:
   - Copy `.env.example` to a new file named `.env`: `cp .env.example .env`
   - Edit `.env` and add your API key: `GEMINI_API_KEY=your_api_key_here`
   - **IMPORTANT**: Never commit your `.env` file to version control

## Security

⚠️ **NEVER commit API keys directly in your code** ⚠️

- Always use environment variables for sensitive information
- The `.env` file is included in `.gitignore` to prevent accidental exposure
- If you've accidentally committed API keys, rotate them immediately

### Handling GitHub Security Alerts

If you receive a GitHub security alert about exposed secrets:

1. **Rotate your API keys immediately** - Go to the Google Cloud Console and regenerate the affected API key
2. **Remove the key from your repository history** - Consider using tools like BFG Repo-Cleaner or git-filter-repo
3. **Update your local .env file** with the new API key
4. **Verify the fix** by ensuring no hardcoded keys remain in the code

## Usage

1. Run the application:

```bash
python3 app.py
```

2. Open your browser and navigate to http://localhost:5000

3. Upload your resume (PDF or DOCX format)

4. View detailed analysis results and suggestions

## Configuration

The application can be configured by modifying `config.py`:

- Change AI providers (Gemini is the default)
- Adjust analysis parameters
- Configure file upload settings

## Deployment

This application can be deployed to services like Heroku, Railway, or Render. Follow their respective documentation for deploying Flask applications.

## Dependencies

- Flask
- PyPDF2
- python-docx
- google-generativeai
- werkzeug

## License

[MIT License](LICENSE)
