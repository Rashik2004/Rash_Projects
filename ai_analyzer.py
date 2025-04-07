import os
import json
import requests
from config import Config

class AIAnalyzer:
    def __init__(self):
        self.api_key = Config.OPENAI_API_KEY
        self.hf_api_key = Config.HUGGINGFACE_API_KEY
        self.gemini_api_key = Config.GEMINI_API_KEY
        self.api_provider = Config.AI_PROVIDER
        self.model = Config.AI_MODEL
        self.max_tokens = Config.MAX_TOKENS

    def is_configured(self):
        """Check if API key is configured"""
        if self.api_provider == "openai":
            return bool(self.api_key)
        elif self.api_provider == "huggingface":
            return bool(self.hf_api_key)
        elif self.api_provider == "gemini":
            return bool(self.gemini_api_key)
        return False

    def analyze_resume(self, resume_text):
        """
        Perform AI analysis on the resume
        """
        if not self.is_configured():
            return {
                "error": f"{self.api_provider} API key not configured. Check config.py file."
            }

        try:
            # Create the prompt for resume analysis
            prompt = self._create_analysis_prompt(resume_text)

            # Call the appropriate API based on provider
            if self.api_provider == "openai":
                return self._call_openai_api(prompt)
            elif self.api_provider == "huggingface":
                return self._call_huggingface_api(prompt)
            elif self.api_provider == "gemini":
                return self._call_gemini_api(prompt)
            else:
                return {
                    "error": f"Unsupported AI provider: {self.api_provider}"
                }

        except Exception as e:
            return {
                "error": f"Error calling {self.api_provider} API: {str(e)}",
                "details": str(e)
            }

    def _call_openai_api(self, prompt):
        """Call OpenAI API"""
        try:
            try:
                import openai
            except ImportError:
                raise Exception("OpenAI module not installed. Please install using: pip install openai")

            openai.api_key = self.api_key

            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert resume reviewer and career coach."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=0.2,  # Lower temperature for more deterministic results
            )

            # Extract and parse the response
            result = response.choices[0].message.content
            return self._parse_response(result)

        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    def _call_huggingface_api(self, prompt):
        """Call Hugging Face Inference API"""
        try:
            API_URL = f"https://api-inference.huggingface.co/models/{self.model}"
            headers = {"Authorization": f"Bearer {self.hf_api_key}"}

            # Format prompt for HF models
            payload = {
                "inputs": f"<|system|>\nYou are an expert resume reviewer and career coach.\n<|user|>\n{prompt}\n<|assistant|>",
                "parameters": {
                    "max_new_tokens": self.max_tokens,
                    "temperature": 0.2,
                    "return_full_text": False
                }
            }

            response = requests.post(API_URL, headers=headers, json=payload)
            response.raise_for_status()  # Raise exception for HTTP errors

            result = response.json()

            # Extract the generated text
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get('generated_text', '')
                return self._parse_response(generated_text)
            else:
                raise Exception(f"Unexpected response format: {result}")

        except Exception as e:
            raise Exception(f"Hugging Face API error: {str(e)}")

    def _call_gemini_api(self, prompt):
        """Call Google's Gemini API"""
        try:
            # Import here to avoid dependency issues
            import google.generativeai as genai

            # Configure Gemini API
            genai.configure(api_key=self.gemini_api_key)

            # Get the specified model
            model = genai.GenerativeModel(self.model)

            # Create the request
            system_instruction = "You are an expert resume reviewer and career coach. Provide detailed, constructive feedback."

            # Add safety settings to avoid rate limiting
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]

            # Updated API call with current model format
            response = model.generate_content(
                system_instruction + "\n\n" + prompt,
                generation_config={
                    "max_output_tokens": self.max_tokens,
                    "temperature": 0.2,
                },
                safety_settings=safety_settings
            )

            # Extract the generated text
            result = response.text
            return self._parse_response(result)

        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

    def _parse_response(self, result):
        """Parse the response from the API"""
        try:
            # Attempt to parse as JSON
            json_start = result.find('{')
            json_end = result.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = result[json_start:json_end]
                return json.loads(json_str)
            else:
                # Format as structured response if not JSON
                return self._format_text_response(result)
        except json.JSONDecodeError:
            # Format as structured response if JSON parsing fails
            return self._format_text_response(result)

    def _create_analysis_prompt(self, resume_text):
        """
        Create a detailed prompt for AI analysis
        """
        return f"""
Please analyze this resume and provide detailed, actionable feedback in JSON format:

{resume_text}

Format your response as a JSON object with the following structure:
{{
  "ats_score": <score_from_0_to_100>,
  "formatting_feedback": [
    {{
      "issue": "<issue_description>",
      "details": "<specific_details>",
      "suggestion": "<actionable_suggestion>"
    }}
  ],
  "content_feedback": [
    {{
      "issue": "<issue_description>",
      "details": "<specific_details>",
      "suggestion": "<actionable_suggestion>"
    }}
  ],
  "strengths": [
    "<strength1>",
    "<strength2>"
  ],
  "improvement_priorities": [
    "<priority1>",
    "<priority2>"
  ],
  "keyword_analysis": {{
    "missing_keywords": ["<keyword1>", "<keyword2>"],
    "industry_specific_recommendations": "<recommendations>"
  }},
  "overall_impression": "<overall_impression>"
}}

Provide specific examples from the resume when pointing out issues or strengths. Make all feedback constructive and actionable.
"""

    def _format_text_response(self, text_response):
        """Format text response into a structured dictionary"""
        # Simple formatter for non-JSON responses
        lines = text_response.split('\n')
        sections = {}
        current_section = "general"
        sections[current_section] = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.endswith(':') and len(line) < 50:
                current_section = line[:-1].lower().replace(' ', '_')
                sections[current_section] = []
            else:
                sections[current_section].append(line)

        # Convert to standard format
        result = {
            "ai_analysis": True,
            "sections": sections,
            "raw_text": text_response
        }

        # Try to extract ATS score if mentioned
        ats_score_match = None
        for section, content in sections.items():
            for line in content:
                if "ats score" in line.lower() or "ats rating" in line.lower():
                    # Try to extract numeric value
                    import re
                    numbers = re.findall(r'\d+', line)
                    if numbers:
                        result["ats_score"] = int(numbers[0])
                        break

        return result
