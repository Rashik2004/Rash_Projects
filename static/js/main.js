document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("resumeForm");
  const input = document.getElementById("resumeInput");
  const scoreResult = document.getElementById("scoreResult");
  const progressWrapper = document.getElementById("progressWrapper");
  const progressBar = document.getElementById("progressBar");
  const uploadIcon = document.getElementById("uploadIcon");
  const filePreview = document.getElementById("filePreview");
  const fileName = document.getElementById("fileName");

  console.log("DOM loaded, checking elements");
  if (!form) console.error("Form element not found");
  if (!input) console.error("Input element not found");

  // Handle file selection to display the file name
  input.addEventListener("change", function () {
    if (input.files.length > 0) {
      const file = input.files[0];
      console.log(`File selected: ${file.name}`);

      // Show file name and change the display
      fileName.textContent = file.name;
      uploadIcon.classList.add("hidden");
      filePreview.classList.remove("hidden");
    } else {
      // Reset to initial state if no file is selected
      uploadIcon.classList.remove("hidden");
      filePreview.classList.add("hidden");
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("Form submitted");

    if (!input.files.length) {
      alert("Please upload a resume file.");
      console.error("No file selected");
      return;
    }

    const file = input.files[0];
    console.log(
      `Selected file: ${file.name}, type: ${file.type}, size: ${file.size}`
    );

    const formData = new FormData();
    formData.append("file", file);
    console.log("FormData created with file");

    try {
      progressWrapper.classList.remove("hidden");
      progressBar.style.width = "0%";
      progressBar.textContent = "0%";
      scoreResult.innerHTML = "";
      scoreResult.classList.add("hidden");

      // Determine the correct endpoint URL based on the current port
      const baseUrl = `${window.location.protocol}//${window.location.hostname}`;
      const port = "5002"; // Updated to use port 5002
      const analyzeUrl = `${baseUrl}:${port}/analyze`;

      console.log(`Sending request to: ${analyzeUrl}`);

      const response = await fetch(analyzeUrl, {
        method: "POST",
        body: formData,
      });

      console.log(`Response status: ${response.status}`);

      const result = await response.json();
      console.log("Analysis result:", result);

      if (result.error) {
        console.error("Error from backend:", result.error);
        throw new Error(result.error);
      }

      // Update UI with enhanced results
      displayResults(result);

      scoreResult.classList.remove("hidden");
      progressBar.style.width = `${result.ats_score}%`;
      progressBar.textContent = `${result.ats_score}%`;
      console.log("UI updated with results");
    } catch (error) {
      console.error("Error during analysis:", error);
      scoreResult.innerHTML = `
        <div class="p-4 bg-red-100 text-red-700 rounded-lg">
          <h3 class="font-bold">Error: ${error.message}</h3>
          <p>Please try again or use a different file.</p>
        </div>
      `;
      scoreResult.classList.remove("hidden");
      progressBar.style.width = "0%";
      progressBar.textContent = "Error";
    }
  });

  function displayResults(data) {
    // Hide loading indicator after results are displayed
    progressWrapper.classList.add("hidden");

    // Create results container
    const resultsContainer = document.createElement("div");
    resultsContainer.id = "analysisResults";
    resultsContainer.className = "mt-10 w-full";

    // Add ATS score
    const scoreColor = getScoreColor(data.ats_score);

    const atsScoreSection = document.createElement("div");
    atsScoreSection.className = "mb-6";
    atsScoreSection.innerHTML = `
        <h3 class="text-xl font-semibold mb-3 text-center">ATS Compatibility Score</h3>
        <div class="flex items-center justify-center">
            <div class="w-32 h-32 rounded-full flex items-center justify-center ${scoreColor.bgLight} ${scoreColor.textDark} border-4 ${scoreColor.border}">
                <span class="text-3xl font-bold">${data.ats_score}%</span>
            </div>
        </div>
    `;
    resultsContainer.appendChild(atsScoreSection);

    // Add overall impression if available (AI analysis)
    if (
      data.ai_analysis &&
      data.ai_insights &&
      data.ai_insights.overall_impression
    ) {
      const overallSection = document.createElement("div");
      overallSection.className =
        "mb-6 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg";
      overallSection.innerHTML = `
            <h3 class="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">Overall Impression</h3>
            <p class="text-blue-800 dark:text-blue-200">${data.ai_insights.overall_impression}</p>
        `;
      resultsContainer.appendChild(overallSection);
    }

    // Add tabs for different sections
    const tabsContainer = document.createElement("div");
    tabsContainer.className = "mb-6";
    tabsContainer.innerHTML = `
        <div class="border-b border-gray-200 dark:border-gray-700">
            <ul class="flex flex-wrap -mb-px" role="tablist">
                <li class="mr-2" role="presentation">
                    <button id="formatting-tab" class="inline-block p-4 border-b-2 border-blue-600 dark:border-blue-500 rounded-t-lg active" aria-selected="true" role="tab" aria-controls="formatting-content">
                        Formatting
                    </button>
                </li>
                <li class="mr-2" role="presentation">
                    <button id="grammar-tab" class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:border-gray-300 dark:hover:border-gray-600" aria-selected="false" role="tab" aria-controls="grammar-content">
                        Content & Grammar
                    </button>
                </li>
                <li class="mr-2" role="presentation">
                    <button id="ats-tab" class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:border-gray-300 dark:hover:border-gray-600" aria-selected="false" role="tab" aria-controls="ats-content">
                        ATS Details
                    </button>
                </li>
                ${
                  data.ai_analysis
                    ? `
                <li role="presentation">
                    <button id="ai-tab" class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:border-gray-300 dark:hover:border-gray-600" aria-selected="false" role="tab" aria-controls="ai-content">
                        AI Insights
                    </button>
                </li>`
                    : ""
                }
            </ul>
        </div>
    `;

    // Create tab content
    const tabContent = document.createElement("div");
    tabContent.className = "pt-4";

    // Formatting tab
    const formattingContent = document.createElement("div");
    formattingContent.id = "formatting-content";
    formattingContent.role = "tabpanel";
    formattingContent.setAttribute("aria-labelledby", "formatting-tab");
    formattingContent.innerHTML = createFormattingHTML(data.formatting_issues);
    tabContent.appendChild(formattingContent);

    // Grammar tab (hidden initially)
    const grammarContent = document.createElement("div");
    grammarContent.id = "grammar-content";
    grammarContent.role = "tabpanel";
    grammarContent.setAttribute("aria-labelledby", "grammar-tab");
    grammarContent.className = "hidden";
    grammarContent.innerHTML = createGrammarHTML(data.grammar_issues);
    tabContent.appendChild(grammarContent);

    // ATS details tab (hidden initially)
    const atsContent = document.createElement("div");
    atsContent.id = "ats-content";
    atsContent.role = "tabpanel";
    atsContent.setAttribute("aria-labelledby", "ats-tab");
    atsContent.className = "hidden";
    atsContent.innerHTML = createAtsDetailsHTML(data.ats_details);
    tabContent.appendChild(atsContent);

    // AI Insights tab (hidden initially)
    if (data.ai_analysis) {
      const aiContent = document.createElement("div");
      aiContent.id = "ai-content";
      aiContent.role = "tabpanel";
      aiContent.setAttribute("aria-labelledby", "ai-tab");
      aiContent.className = "hidden";
      aiContent.innerHTML = createAIInsightsHTML(data.ai_insights);
      tabContent.appendChild(aiContent);
    }

    resultsContainer.appendChild(tabsContainer);
    resultsContainer.appendChild(tabContent);

    // Insert results after progress wrapper
    progressWrapper.after(resultsContainer);

    // Add tab switching functionality
    document
      .getElementById("formatting-tab")
      .addEventListener("click", () => switchTab("formatting"));
    document
      .getElementById("grammar-tab")
      .addEventListener("click", () => switchTab("grammar"));
    document
      .getElementById("ats-tab")
      .addEventListener("click", () => switchTab("ats"));
    if (data.ai_analysis) {
      document
        .getElementById("ai-tab")
        .addEventListener("click", () => switchTab("ai"));
    }
  }

  function switchTab(tabName) {
    // Hide all tabs and make buttons inactive
    document.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
      panel.classList.add("hidden");
    });

    document.querySelectorAll('[role="tab"]').forEach((tab) => {
      tab.classList.remove("border-blue-600", "dark:border-blue-500");
      tab.classList.add("border-transparent");
      tab.setAttribute("aria-selected", "false");
    });

    // Show selected tab and make button active
    document.getElementById(`${tabName}-content`).classList.remove("hidden");
    const activeTab = document.getElementById(`${tabName}-tab`);
    activeTab.classList.remove("border-transparent");
    activeTab.classList.add("border-blue-600", "dark:border-blue-500");
    activeTab.setAttribute("aria-selected", "true");
  }

  function createFormattingHTML(formattingData) {
    const issues = formattingData.issues || [];
    const positivePoints = formattingData.positive_points || [];

    let html = "";

    // Display positive points
    if (positivePoints.length > 0) {
      html +=
        '<div class="mb-6"><h3 class="text-lg font-semibold mb-2 text-green-600 dark:text-green-400">What You\'re Doing Well</h3>';
      html += '<ul class="space-y-3">';

      positivePoints.forEach((point) => {
        html += `<li class="bg-green-50 dark:bg-green-900/30 p-3 rounded flex">
                <span class="text-green-600 dark:text-green-400 mr-2">✓</span>
                <div>
                    <p class="font-medium text-green-700 dark:text-green-300">${
                      point.message
                    }</p>
                    ${
                      point.detail
                        ? `<p class="text-sm text-green-600 dark:text-green-400">${point.detail}</p>`
                        : ""
                    }
                </div>
            </li>`;
      });

      html += "</ul></div>";
    }

    // Display issues
    if (issues.length > 0) {
      html +=
        '<div><h3 class="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Areas to Improve</h3>';
      html += '<ul class="space-y-3">';

      issues.forEach((issue) => {
        html += `<li class="bg-red-50 dark:bg-red-900/30 p-3 rounded">
                <p class="font-medium text-red-700 dark:text-red-300">${
                  issue.message
                }</p>
                ${
                  issue.content
                    ? `<p class="text-sm text-red-600 dark:text-red-400 mt-1 font-mono bg-red-100 dark:bg-red-900/50 p-2 rounded">${issue.content}</p>`
                    : ""
                }
                ${
                  issue.suggestion
                    ? `<p class="text-sm text-red-600 dark:text-red-400 mt-1"><strong>Suggestion:</strong> ${issue.suggestion}</p>`
                    : ""
                }
            </li>`;
      });

      html += "</ul></div>";
    }

    if (issues.length === 0 && positivePoints.length === 0) {
      html =
        '<p class="text-center text-gray-600 dark:text-gray-400">No formatting issues or positive points found.</p>';
    }

    return html;
  }

  function createGrammarHTML(grammarData) {
    const issues = grammarData.issues || [];
    const positivePoints = grammarData.positive_points || [];

    let html = "";

    // Display positive points
    if (positivePoints.length > 0) {
      html +=
        '<div class="mb-6"><h3 class="text-lg font-semibold mb-2 text-green-600 dark:text-green-400">Strengths</h3>';
      html += '<ul class="space-y-3">';

      positivePoints.forEach((point) => {
        html += `<li class="bg-green-50 dark:bg-green-900/30 p-3 rounded flex">
                <span class="text-green-600 dark:text-green-400 mr-2">✓</span>
                <div>
                    <p class="font-medium text-green-700 dark:text-green-300">${
                      point.message
                    }</p>
                    ${
                      point.detail
                        ? `<p class="text-sm text-green-600 dark:text-green-400">${point.detail}</p>`
                        : ""
                    }
                </div>
            </li>`;
      });

      html += "</ul></div>";
    }

    // Display issues
    if (issues.length > 0) {
      html +=
        '<div><h3 class="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Issues to Address</h3>';
      html += '<ul class="space-y-3">';

      issues.forEach((issue) => {
        html += `<li class="bg-red-50 dark:bg-red-900/30 p-3 rounded">
                <p class="font-medium text-red-700 dark:text-red-300">${
                  issue.line > 0 ? `Line ${issue.line}: ` : ""
                }${issue.message}</p>
                ${
                  issue.content
                    ? `<p class="text-sm text-red-600 dark:text-red-400 mt-1 font-mono bg-red-100 dark:bg-red-900/50 p-2 rounded">${issue.content}</p>`
                    : ""
                }
                ${
                  issue.suggestion
                    ? `<p class="text-sm text-red-600 dark:text-red-400 mt-1"><strong>Suggestion:</strong> ${issue.suggestion}</p>`
                    : ""
                }
            </li>`;
      });

      html += "</ul></div>";
    }

    if (issues.length === 0 && positivePoints.length === 0) {
      html =
        '<p class="text-center text-gray-600 dark:text-gray-400">No grammar issues or positive points found.</p>';
    }

    return html;
  }

  function createAtsDetailsHTML(atsDetails) {
    if (!atsDetails) {
      return '<p class="text-center text-gray-600 dark:text-gray-400">No ATS details available.</p>';
    }

    let html = '<div class="space-y-6">';

    // Keywords section
    if (atsDetails.keywords) {
      html += `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-400">Keywords</h3>
            <div class="mb-2">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${
                      (atsDetails.keywords.score /
                        atsDetails.keywords.max_score) *
                      100
                    }%"></div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${
                  atsDetails.keywords.score
                }/${atsDetails.keywords.max_score} points</p>
            </div>`;

      if (Object.keys(atsDetails.keywords.found).length > 0) {
        html +=
          '<div class="mb-3"><h4 class="text-sm font-medium mb-1">Found Keywords</h4><ul class="grid grid-cols-2 gap-1">';

        Object.entries(atsDetails.keywords.found).forEach(
          ([keyword, description]) => {
            html += `<li class="text-sm"><span class="text-green-600 dark:text-green-400">✓</span> ${keyword}</li>`;
          }
        );

        html += "</ul></div>";
      }

      if (Object.keys(atsDetails.keywords.missing).length > 0) {
        html +=
          '<div><h4 class="text-sm font-medium mb-1">Missing Keywords</h4><ul class="grid grid-cols-2 gap-1">';

        Object.entries(atsDetails.keywords.missing).forEach(
          ([keyword, description]) => {
            html += `<li class="text-sm"><span class="text-red-600 dark:text-red-400">✗</span> ${keyword}</li>`;
          }
        );

        html += "</ul></div>";
      }

      html += "</div>";
    }

    // Contact info section
    if (atsDetails.contact_info) {
      html += `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-400">Contact Information</h3>
            <div class="mb-3">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${
                      (atsDetails.contact_info.score /
                        atsDetails.contact_info.max_score) *
                      100
                    }%"></div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${
                  atsDetails.contact_info.score
                }/${atsDetails.contact_info.max_score} points</p>
            </div>
            <ul class="space-y-1">`;

      const contactItems = {
        email: "Email Address",
        phone: "Phone Number",
        linkedin: "LinkedIn Profile",
        website: "Website or Portfolio",
      };

      Object.entries(atsDetails.contact_info.details).forEach(
        ([key, value]) => {
          const label = contactItems[key] || key;
          html += `<li class="text-sm flex items-start">
                <span class="${
                  value
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                } mr-2">${value ? "✓" : "✗"}</span>
                <span>${label}</span>
            </li>`;
        }
      );

      html += "</ul></div>";
    }

    // Content section
    if (atsDetails.content) {
      html += `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-400">Content Analysis</h3>
            <div class="mb-3">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${
                      (atsDetails.content.score /
                        atsDetails.content.max_score) *
                      100
                    }%"></div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${
                  atsDetails.content.score
                }/${atsDetails.content.max_score} points</p>
            </div>
            <ul class="space-y-2">
                <li class="text-sm">
                    <span class="font-medium">Word Count:</span> ${
                      atsDetails.content.word_count
                    } words
                    ${
                      atsDetails.content.word_count < 300
                        ? '<span class="text-red-600 dark:text-red-400 ml-2">(Too short)</span>'
                        : atsDetails.content.word_count > 700
                        ? '<span class="text-red-600 dark:text-red-400 ml-2">(Too long)</span>'
                        : '<span class="text-green-600 dark:text-green-400 ml-2">(Good length)</span>'
                    }
                </li>
                <li class="text-sm">
                    <span class="font-medium">Unique Words:</span> ${
                      atsDetails.content.unique_words
                    }
                    ${
                      atsDetails.content.unique_words < 150
                        ? '<span class="text-red-600 dark:text-red-400 ml-2">(Limited vocabulary)</span>'
                        : '<span class="text-green-600 dark:text-green-400 ml-2">(Good variety)</span>'
                    }
                </li>
                <li class="text-sm">
                    <span class="font-medium">Recommended:</span> ${
                      atsDetails.content.recommended_length
                    }
                </li>
            </ul>
        </div>`;
    }

    html += "</div>";
    return html;
  }

  function createAIInsightsHTML(aiInsights) {
    if (!aiInsights || Object.keys(aiInsights).length === 0) {
      return '<p class="text-center text-gray-600 dark:text-gray-400">No AI insights available.</p>';
    }

    let html = '<div class="space-y-6">';

    // Improvement priorities
    if (
      aiInsights.improvement_priorities &&
      aiInsights.improvement_priorities.length > 0
    ) {
      html += `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-3 text-purple-700 dark:text-purple-400">Priority Improvements</h3>
            <ol class="list-decimal pl-5 space-y-2">`;

      aiInsights.improvement_priorities.forEach((priority) => {
        html += `<li class="text-gray-800 dark:text-gray-200">${priority}</li>`;
      });

      html += "</ol></div>";
    }

    // Keyword analysis
    if (aiInsights.keyword_analysis) {
      html += `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-3 text-purple-700 dark:text-purple-400">Keyword Analysis</h3>`;

      if (
        aiInsights.keyword_analysis.missing_keywords &&
        aiInsights.keyword_analysis.missing_keywords.length > 0
      ) {
        html += `
            <div class="mb-3">
                <h4 class="text-sm font-medium mb-2">Suggested Keywords to Add</h4>
                <div class="flex flex-wrap gap-2">`;

        aiInsights.keyword_analysis.missing_keywords.forEach((keyword) => {
          html += `<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">${keyword}</span>`;
        });

        html += "</div></div>";
      }

      if (aiInsights.keyword_analysis.industry_specific_recommendations) {
        html += `
            <div>
                <h4 class="text-sm font-medium mb-2">Industry-Specific Recommendations</h4>
                <p class="text-gray-700 dark:text-gray-300">${aiInsights.keyword_analysis.industry_specific_recommendations}</p>
            </div>`;
      }

      html += "</div>";
    }

    // Add any other AI insights here

    html += "</div>";
    return html;
  }

  function getScoreColor(score) {
    if (score >= 80) {
      return {
        bgLight: "bg-green-100 dark:bg-green-900/50",
        textDark: "text-green-800 dark:text-green-200",
        border: "border-green-500",
      };
    } else if (score >= 60) {
      return {
        bgLight: "bg-yellow-100 dark:bg-yellow-900/50",
        textDark: "text-yellow-800 dark:text-yellow-200",
        border: "border-yellow-500",
      };
    } else {
      return {
        bgLight: "bg-red-100 dark:bg-red-900/50",
        textDark: "text-red-800 dark:text-red-200",
        border: "border-red-500",
      };
    }
  }
});
