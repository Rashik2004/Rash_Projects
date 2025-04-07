try:
import PyPDF2
except ImportError:
    print("Warning: PyPDF2 module not installed. PDF analysis will not work.")
    print("Install with: pip3 install PyPDF2")
    PyPDF2 = None

try:
import docx
except ImportError:
    print("Warning: python-docx module not installed. DOCX analysis will not work.")
    print("Install with: pip3 install python-docx")
    docx = None

import re
from werkzeug.utils import secure_filename
import os
import traceback
import textwrap
from config import Config

class ResumeAnalyzer:
    def __init__(self):
        # Ensure upload folder exists
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

        # Initialize AI analyzer if enabled
        if Config.USE_AI_ANALYSIS:
            try:
                from ai_analyzer import AIAnalyzer
                self.ai_analyzer = AIAnalyzer()
                print(f"AI Analysis {'enabled and configured' if self.ai_analyzer.is_configured() else 'enabled but API key not configured'}")
            except ImportError as e:
                print(f"Error importing AI analyzer: {e}. Falling back to regular analysis.")
                print("Install required packages with: pip install google-generativeai")

    def allowed_file(self, filename):
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

    def extract_text(self, file):
        try:
            # Check if file is a string (file path) or a file-like object
            if isinstance(file, str):
                file_path = file
                filename = os.path.basename(file_path)
            else:
                # It's a file-like object from request
        filename = secure_filename(file.filename)
        file_path = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(file_path)

            # Extract text based on file extension
            if filename.lower().endswith('.pdf'):
                text = self._extract_text_from_pdf(file_path)
            elif filename.lower().endswith('.docx'):
                text = self._extract_text_from_docx(file_path)
            else:
                text = "Unsupported file format. Please upload PDF or DOCX files."

            # Clean up the temporary file if we created one (not if we were passed a path)
            if not isinstance(file, str) and os.path.exists(file_path):
                try:
            os.remove(file_path)
                except Exception as e:
                    print(f"Error removing temporary file: {str(e)}")

        return text
        except Exception as e:
            print(f"Error extracting text: {str(e)}")
            print(traceback.format_exc())
            return "Error extracting text from file."

    def _extract_text_from_pdf(self, file_path):
        try:
            if PyPDF2 is None:
                return "Error: PyPDF2 module not installed. Please install with: pip3 install PyPDF2"

        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                    extracted_text = page.extract_text()
                    if extracted_text:
                        text += extracted_text
        return text
        except Exception as e:
            print(f"Error extracting text from PDF: {str(e)}")
            print(traceback.format_exc())
            return "Error extracting text from PDF file."

    def _extract_text_from_docx(self, file_path):
        try:
            if docx is None:
                return "Error: python-docx module not installed. Please install with: pip3 install python-docx"

        doc = docx.Document(file_path)
            paragraphs = [paragraph.text for paragraph in doc.paragraphs if paragraph.text]
            return "\n".join(paragraphs)
        except Exception as e:
            print(f"Error extracting text from DOCX: {str(e)}")
            print(traceback.format_exc())
            return "Error extracting text from DOCX file."

    def analyze_formatting(self, text):
        issues = []
        positive_points = []

        if not text or text.startswith("Error"):
            return ["Could not analyze formatting due to text extraction issues."]

        # Check line length
        lines = text.split('\n')
        long_lines = []

        for i, line in enumerate(lines):
            if len(line) > 100:
                # Truncate long lines for display
                truncated = line[:50] + "..." + line[-20:] if len(line) > 75 else line
                suggestion = textwrap.fill(line, width=80).replace('\n', '\n    ')
                long_lines.append({
                    "line_number": i+1,
                    "content": truncated,
                    "length": len(line),
                    "suggestion": f"Break into shorter lines:\n    {suggestion}"
                })

        if long_lines:
            for issue in long_lines[:3]:  # Show first 3 detailed issues
                issues.append({
                    "type": "long_line",
                    "message": f"Line {issue['line_number']} is too long ({issue['length']} characters)",
                    "content": issue['content'],
                    "suggestion": issue['suggestion']
                })

            if len(long_lines) > 3:
                issues.append({
                    "type": "long_line_summary",
                    "message": f"Plus {len(long_lines) - 3} more lines are too long",
                    "content": "",
                    "suggestion": "Break these into shorter lines (60-80 characters per line)"
                })
        else:
            positive_points.append({
                "type": "line_length",
                "message": "All lines have appropriate length",
                "detail": "Your text has good readability with proper line lengths"
            })

        # Check spacing
        excessive_spaces = []
        for i, line in enumerate(lines):
            matches = list(re.finditer(r'\s{2,}', line))
            if matches:
                for match in matches:
                    excessive_spaces.append({
                        "line_number": i+1,
                        "content": line[max(0, match.start()-20):min(len(line), match.end()+20)],
                        "position": f"characters {match.start()}-{match.end()}"
                    })

        if excessive_spaces:
            for issue in excessive_spaces[:3]:
                issues.append({
                    "type": "excessive_space",
                    "message": f"Multiple spaces on line {issue['line_number']} at {issue['position']}",
                    "content": issue['content'].replace(' ', '•'),  # Replace spaces with visible dots
                    "suggestion": "Remove extra spaces to maintain consistent formatting"
                })
        else:
            positive_points.append({
                "type": "spacing",
                "message": "Proper spacing throughout document",
                "detail": "Your resume has consistent spacing which improves readability"
            })

        # Check blank lines
        if '\n\n\n' in text:
            triple_newlines = text.count('\n\n\n')
            issues.append({
                "type": "blank_lines",
                "message": f"Excessive blank lines detected ({triple_newlines} instances)",
                "content": "Example: line followed by multiple empty lines",
                "suggestion": "Use single blank lines between sections for better spacing consistency"
            })
        else:
            positive_points.append({
                "type": "blank_lines",
                "message": "Appropriate use of blank lines",
                "detail": "Your document uses proper spacing between sections"
            })

        # Check section headers
        common_sections = ['education', 'experience', 'skills', 'projects', 'certifications', 'summary']
        found_sections = [section for section in common_sections if section.lower() in text.lower()]

        if len(found_sections) >= 3:
            positive_points.append({
                "type": "sections",
                "message": f"Good structure with key sections: {', '.join(found_sections)}",
                "detail": "Your resume includes essential sections that recruiters look for"
            })
        else:
            missing = set(common_sections) - set(found_sections)
            issues.append({
                "type": "missing_sections",
                "message": f"Missing important sections",
                "content": f"Found: {', '.join(found_sections) if found_sections else 'No standard sections detected'}",
                "suggestion": f"Consider adding: {', '.join(missing)}"
            })

        # Check bullet points
        bullet_patterns = [r'•\s', r'■\s', r'◆\s', r'▪\s', r'●\s', r'○\s', r'★\s', r'-\s']
        has_bullets = any(re.search(pattern, text) for pattern in bullet_patterns)

        if has_bullets:
            positive_points.append({
                "type": "bullet_points",
                "message": "Good use of bullet points",
                "detail": "Bullet points help break down information and improve readability"
            })
        else:
            issues.append({
                "type": "no_bullets",
                "message": "No bullet points detected",
                "content": "Your resume appears to use paragraph format",
                "suggestion": "Use bullet points to highlight achievements and experiences"
            })

        return {
            "issues": issues,
            "positive_points": positive_points
        }

    def analyze_grammar(self, text):
        grammar_issues = []
        positive_points = []

        if not text or text.startswith("Error"):
            return {
                "issues": [{
                    "message": "Could not analyze grammar due to text extraction issues.",
                    "line": 0,
                    "content": "",
                    "suggestion": "Try uploading the file again or check file format"
                }],
                "positive_points": []
            }

        # Check for common grammatical mistakes
        grammar_patterns = {
            r'\bi am\b': {
                "message": "Use 'I am' with capital 'I'",
                "suggestion": "Capitalize 'I' in 'I am'"
            },
            r'\bi\s': {
                "message": "Use capital 'I' for the personal pronoun",
                "suggestion": "Capitalize the pronoun 'I'"
            },
            r'\s{2,}': {
                "message": "Multiple spaces detected",
                "suggestion": "Remove extra spaces"
            },
            r'\b[a-z]+ed [a-z]+ed\b': {
                "message": "Consecutive past tense verbs",
                "suggestion": "Consider restructuring to avoid consecutive past tense verbs"
            },
            r'\b([a-z]+) and ([a-z]+) and ([a-z]+)\b': {
                "message": "Consider using commas for lists instead of multiple 'and's",
                "suggestion": "Change to '\\1, \\2, and \\3'"
            },
            r'\b(very|really|extremely|basically|actually) ': {
                "message": "Avoid unnecessary adverbs",
                "suggestion": "Remove or replace with stronger, more specific words"
            },
            r'(\.|,|;|:|!|\?)([a-zA-Z])': {
                "message": "Missing space after punctuation",
                "suggestion": "Add a space after punctuation marks"
            },
            r'\b(their|there|they\'re)\b': {
                "message": "Verify correct usage of 'their/there/they're'",
                "suggestion": "their = possession, there = location, they're = they are"
            },
            r'\b(your|you\'re)\b': {
                "message": "Verify correct usage of 'your/you're'",
                "suggestion": "your = possession, you're = you are"
            },
            r'\b(its|it\'s)\b': {
                "message": "Verify correct usage of 'its/it's'",
                "suggestion": "its = possession, it's = it is"
            },
            r'\b(affect|effect)\b': {
                "message": "Verify correct usage of 'affect/effect'",
                "suggestion": "affect = verb (to influence), effect = noun (result)"
            },
            r'\s+,': {
                "message": "Space before comma",
                "suggestion": "Remove space before comma"
            },
            r'\s+\.': {
                "message": "Space before period",
                "suggestion": "Remove space before period"
            }
        }

        # Check missing space after punctuation marks, but exclude email addresses, domains, and vertical bars
        lines = text.split('\n')
        email_regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        url_regex = r'[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[a-zA-Z0-9._%+-]*)*'
        contact_info_regex = r'[a-zA-Z0-9._%+-]+\|[a-zA-Z0-9._%+-]+'  # Match text|text pattern

        for i, line in enumerate(lines):
            # First extract all emails, URLs, and contact info with vertical bars to exclude them from checks
            emails = re.findall(email_regex, line)
            urls = re.findall(url_regex, line)
            contact_separators = re.findall(contact_info_regex, line)
            exclude_ranges = []

            for email in emails:
                start = line.find(email)
                end = start + len(email)
                exclude_ranges.append((start, end))

            for url in urls:
                start = line.find(url)
                end = start + len(url)
                exclude_ranges.append((start, end))

            # Also exclude any text with vertical bars as separators
            for contact in contact_separators:
                start = line.find(contact)
                end = start + len(contact)
                exclude_ranges.append((start, end))

            # Also exclude vertical bar patterns manually
            bar_indices = [m.start() for m in re.finditer(r'\|', line)]
            for idx in bar_indices:
                # Add a margin of 5 characters before and after the vertical bar
                exclude_ranges.append((max(0, idx-5), min(len(line), idx+6)))

            # Check for missing space after punctuation (excluding vertical bars completely)
            for match in re.finditer(r'[.,:;!?][a-zA-Z]', line):
                # Check if match is in excluded ranges
                match_start = match.start()
                match_end = match.end()
                in_excluded_range = False

                for start, end in exclude_ranges:
                    if match_start >= start and match_end <= end:
                        in_excluded_range = True
                        break

                # Skip this match if it contains a vertical bar or is in an excluded range
                char_at_match = line[match_start:match_start+1]
                if not in_excluded_range and char_at_match != '|':
                    issue_text = line[max(0, match.start()-20):min(len(line), match.end()+20)]
                    grammar_issues.append({
                        "message": "Missing space after punctuation",
                        "line": i+1,
                        "content": issue_text,
                        "suggestion": f"Add a space after punctuation marks"
                    })

            # Check for other grammar patterns
            for pattern, issue in grammar_patterns.items():
                matches = list(re.finditer(pattern, line, re.IGNORECASE))
                for match in matches:
                    issue_text = line[max(0, match.start()-20):min(len(line), match.end()+20)]
                    grammar_issues.append({
                        "message": issue["message"],
                        "line": i+1,
                        "content": issue_text,
                        "suggestion": issue["suggestion"]
                    })

        # Check writing style
        word_count = len(text.split())
        avg_sentence_length = 0
        sentences = re.split(r'[.!?]+', text)
        if sentences:
            sentence_lengths = [len(s.split()) for s in sentences if s.strip()]
            if sentence_lengths:
                avg_sentence_length = sum(sentence_lengths) / len(sentence_lengths)

        if avg_sentence_length > 25:
            grammar_issues.append({
                "message": "Sentences are too long on average",
                "line": 0,
                "content": f"Average sentence length: {avg_sentence_length:.1f} words",
                "suggestion": "Aim for sentences 15-20 words long for better readability"
            })
        elif 15 <= avg_sentence_length <= 25:
            positive_points.append({
                "type": "sentence_length",
                "message": "Good sentence length",
                "detail": f"Average sentence length ({avg_sentence_length:.1f} words) is appropriate for professional writing"
            })

        # Check for passive voice (simple check)
        passive_patterns = [
            r'\b(?:am|is|are|was|were|be|been|being)\s+\w+ed\b',
            r'\b(?:am|is|are|was|were|be|been|being)\s+\w+en\b'
        ]

        passive_count = 0
        for pattern in passive_patterns:
            passive_count += len(re.findall(pattern, text, re.IGNORECASE))

        if passive_count > word_count / 100:  # More than 1% passive voice
            grammar_issues.append({
                "message": f"Too many instances of passive voice ({passive_count})",
                "line": 0,
                "content": "Example: 'Reports were written' instead of 'I wrote reports'",
                "suggestion": "Use active voice: 'I achieved/created/led' instead of 'was achieved/created/led'"
            })
        else:
            positive_points.append({
                "type": "active_voice",
                "message": "Good use of active voice",
                "detail": "Your resume effectively uses active voice which is more impactful"
            })

        # Add positive point for grammar if few issues
        if len(grammar_issues) <= 2:
            positive_points.append({
                "type": "grammar",
                "message": "Excellent grammar overall",
                "detail": "Your resume demonstrates strong command of grammar and professional writing"
            })

        # Limit to top 10 issues to avoid overwhelming feedback
        if len(grammar_issues) > 10:
            return {
                "issues": grammar_issues[:10],
                "positive_points": positive_points
            }
        else:
            return {
                "issues": grammar_issues,
                "positive_points": positive_points
            }

    def calculate_ats_score(self, text):
        if not text or text.startswith("Error"):
            return {
                "score": 0,
                "details": {}
            }

        text_lower = text.lower()
        score_details = {}

        # Keywords check
        keywords = {
            'experience': 'Work history/roles',
            'skills': 'Technical/soft skills',
            'education': 'Academic background',
            'projects': 'Professional/personal projects',
            'achievements': 'Accomplishments/results',
            'accomplishments': 'Key successes',
            'certifications': 'Professional certifications',
            'qualifications': 'Professional qualifications',
            'leadership': 'Leadership experience',
            'teamwork': 'Team collaboration'
        }

        found_keywords = {}
        for keyword, description in keywords.items():
            if keyword.lower() in text_lower:
                found_keywords[keyword] = description

        keyword_score = len(found_keywords) * 8  # 8 points per keyword found
        score_details["keywords"] = {
            "score": min(keyword_score, 40),  # Cap at 40 points
            "max_score": 40,
            "found": found_keywords,
            "missing": {k: v for k, v in keywords.items() if k not in found_keywords}
        }

        # Contact information check
        contact_info = {
            "email": bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)),
            "phone": bool(re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text)),
            "linkedin": bool(re.search(r'linkedin\.com/in/[\w-]+', text.lower())),
            "website": bool(re.search(r'(github\.com|[\w-]+\.com|[\w-]+\.io)[\w/]+', text.lower()) and not re.search(r'linkedin\.com', text.lower()))
        }

        contact_score = 0
        if contact_info["email"]: contact_score += 10
        if contact_info["phone"]: contact_score += 10
        if contact_info["linkedin"]: contact_score += 5
        if contact_info["website"]: contact_score += 5

        score_details["contact_info"] = {
            "score": contact_score,
            "max_score": 30,
            "details": contact_info
        }

        # Length and content checks
        word_count = len(text.split())
        unique_words = len(set(text_lower.split()))

        length_score = min(int(word_count / 50), 10) * 2  # 2 points for every 50 words up to 10 points
        variety_score = min(int(unique_words / 50), 5) * 2  # 2 points for every 50 unique words up to 5 points

        score_details["content"] = {
            "score": length_score + variety_score,
            "max_score": 30,
            "word_count": word_count,
            "unique_words": unique_words,
            "recommended_length": "400-600 words"
        }

        # Calculate final score
        total_score = min(score_details["keywords"]["score"] + score_details["contact_info"]["score"] + score_details["content"]["score"], 100)

        return {
            "score": total_score,
            "details": score_details
        }

    def analyze(self, file):
        try:
            if not file or not file.filename:
                return {
                    'error': 'No file provided',
                    'ats_score': 0,
                    'formatting_issues': {"issues": ["No file to analyze"], "positive_points": []},
                    'grammar_issues': {"issues": [{'message': "No file to analyze", 'line': 0, 'content': "", 'suggestion': ""}], "positive_points": []}
                }

        if not self.allowed_file(file.filename):
                return {
                    'error': 'Invalid file type. Only PDF and DOCX files are supported.',
                    'ats_score': 0,
                    'formatting_issues': {"issues": ["Invalid file format"], "positive_points": []},
                    'grammar_issues': {"issues": [{'message': "Invalid file format", 'line': 0, 'content': "", 'suggestion': ""}], "positive_points": []}
                }

        text = self.extract_text(file)

            # Check if AI analysis is enabled and the API is configured
            if Config.USE_AI_ANALYSIS and hasattr(self, 'ai_analyzer') and self.ai_analyzer.is_configured():
                ai_result = self.ai_analyzer.analyze_resume(text)

                # Check if there was an error with the AI analysis
                if 'error' in ai_result:
                    print(f"AI Analysis Error: {ai_result['error']}")
                    # Fall back to regular analysis if AI fails
                    return self._perform_regular_analysis(text)

                # Process the AI result and merge with regular analysis
                return self._process_ai_result(ai_result, text)
            else:
                # Perform regular analysis if AI is not enabled
                return self._perform_regular_analysis(text)

        except Exception as e:
            print(f"Error in analyze method: {str(e)}")
            print(traceback.format_exc())
            return {
                'error': 'An error occurred during analysis',
                'ats_score': 0,
                'formatting_issues': {"issues": ["Analysis error occurred"], "positive_points": []},
                'grammar_issues': {"issues": [{'message': f"Analysis error: {str(e)}", 'line': 0, 'content': "", 'suggestion': ""}], "positive_points": []}
            }

    def _perform_regular_analysis(self, text):
        """Perform the regular non-AI analysis"""
        ats_result = self.calculate_ats_score(text)
        formatting_result = self.analyze_formatting(text)
        grammar_result = self.analyze_grammar(text)

        return {
            'ats_score': ats_result["score"],
            'ats_details': ats_result["details"],
            'formatting_issues': formatting_result,
            'grammar_issues': grammar_result
        }

    def _process_ai_result(self, ai_result, text):
        """Process and format AI analysis results"""
        # Initialize with base structure
        result = {
            'ai_analysis': True,
            'ats_score': ai_result.get('ats_score', 70),  # Default if not provided
            'ats_details': {},
            'formatting_issues': {"issues": [], "positive_points": []},
            'grammar_issues': {"issues": [], "positive_points": []},
            'ai_insights': {}  # Additional AI-specific insights
        }

        # Format AI formatting feedback
        if 'formatting_feedback' in ai_result:
            for item in ai_result['formatting_feedback']:
                result['formatting_issues']['issues'].append({
                    'type': 'ai_feedback',
                    'message': item.get('issue', ''),
                    'content': item.get('details', ''),
                    'suggestion': item.get('suggestion', '')
                })

        # Format AI content feedback (treat as grammar issues)
        if 'content_feedback' in ai_result:
            for item in ai_result['content_feedback']:
                result['grammar_issues']['issues'].append({
                    'message': item.get('issue', ''),
                    'line': 0,  # AI doesn't provide line numbers
                    'content': item.get('details', ''),
                    'suggestion': item.get('suggestion', '')
                })

        # Add strengths as positive points
        if 'strengths' in ai_result:
            for strength in ai_result['strengths']:
                result['formatting_issues']['positive_points'].append({
                    'type': 'strength',
                    'message': strength,
                    'detail': ''
                })

        # Add improvement priorities
        if 'improvement_priorities' in ai_result:
            result['ai_insights']['improvement_priorities'] = ai_result['improvement_priorities']

        # Add keyword analysis
        if 'keyword_analysis' in ai_result:
            result['ai_insights']['keyword_analysis'] = ai_result['keyword_analysis']

        # Add overall impression
        if 'overall_impression' in ai_result:
            result['ai_insights']['overall_impression'] = ai_result['overall_impression']

        # If the AI analysis is missing crucial data, supplement with regular analysis
        if len(result['formatting_issues']['issues']) == 0 or len(result['grammar_issues']['issues']) == 0:
            regular_result = self._perform_regular_analysis(text)

            # Merge missing parts
            if len(result['formatting_issues']['issues']) == 0:
                result['formatting_issues'] = regular_result['formatting_issues']

            if len(result['grammar_issues']['issues']) == 0:
                result['grammar_issues'] = regular_result['grammar_issues']

            if 'ats_details' not in result or not result['ats_details']:
                result['ats_details'] = regular_result['ats_details']

        return result
