// API Keys
const QUOTE_API_KEY = "YOUR_ZENQUOTES_API_KEY"; 
const STOCK_API_KEY = "vwCfnfqMF_XhfMEegNVWzPNnmzxm1VhF"; // Polygon.io API key
const DOG_API_KEY = "YOUR_DOG_API_KEY"; 

// Quote Functions
function fetchRandomQuote() {
  return fetch("https://zenquotes.io/api/random/")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch quote");
      }
      return response.json();
    })
    .then((data) => {
      return data[0];
    })
    .catch((error) => {
      console.error("Error fetching quote:", error);
      return { q: "Error loading quote", a: "System" };
    });
}

async function loadRandomQuote() {
  try {
    const quoteData = await fetchRandomQuote();
    document.getElementById("quoteText").innerHTML = `"${quoteData.q}"`;
    document.getElementById("quoteAuthor").innerHTML = `- ${quoteData.a}`;
  } catch (error) {
    console.error("Error in loadRandomQuote:", error);
    document.getElementById("quoteText").innerHTML = "Could not load quote";
    document.getElementById("quoteAuthor").innerHTML = "";
  }
}

// Navigation Functions
function navigateToStocks() {
  window.location.href = "stocks.html";
}

function navigateToDogs() {
  window.location.href = "dogs.html";
}

function navigateToHome() {
  window.location.href = "home.html";
}

// Stock Functions
function fetchRedditData() {
  return fetch("https://tradestie.com/api/v1/apps/reddit")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch Reddit data");
      }
      return response.json();
    })
    .then((data) => {
      return data.slice(0, 5); // Return only the top 5 results
    })
    .catch((error) => {
      console.error("Error fetching Reddit data:", error);
      return [];
    });
}

async function loadRedditData() {
  try {
    const redditData = await fetchRedditData();
    const outputDiv = document.getElementById("stockDataOutput");
    
    if (redditData.length === 0) {
      outputDiv.innerHTML = "<p>No Reddit data available</p>";
      return;
    }
    
    outputDiv.innerHTML = "";
    
    // Create table
    const table = document.createElement("table");
    table.className = "data-table";
    
    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    const headers = ["Stock Symbol", "Comments", "Sentiment"];
    headers.forEach(headerText => {
      const th = document.createElement("th");
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement("tbody");
    
    redditData.forEach(item => {
      const row = document.createElement("tr");
      
      // Stock symbol cell with link
      const symbolCell = document.createElement("td");
      const link = document.createElement("a");
      link.href = `https://finance.yahoo.com/quote/${item.ticker}`;
      link.textContent = item.ticker;
      link.target = "_blank";
      symbolCell.appendChild(link);
      
      // Comments count cell
      const commentsCell = document.createElement("td");
      commentsCell.textContent = item.no_of_comments;
      
      // Sentiment image cell
      const sentimentCell = document.createElement("td");
      const img = document.createElement("img");
      img.src = item.sentiment_score > 0 ? "bullish.jpg" : "bearish.jpg";
      img.style.width = "100px";
      img.style.height = "100px";
      sentimentCell.appendChild(img);
      
      // Add cells to row
      row.appendChild(symbolCell);
      row.appendChild(commentsCell);
      row.appendChild(sentimentCell);
      
      // Add row to table body
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    outputDiv.appendChild(table);
  } catch (error) {
    console.error("Error in loadRedditData:", error);
    document.getElementById("stockDataOutput").innerHTML = "<p>Error loading Reddit data</p>";
  }
}

function fetchStockPriceData(symbol, fromTimestamp, toTimestamp) {
  // Format dates as YYYY-MM-DD
  const fromDate = new Date(fromTimestamp).toISOString().split('T')[0];
  const toDate = new Date(toTimestamp).toISOString().split('T')[0];
  
  // Construct API URL with your API key
  const apiUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/1/day/${fromDate}/${toDate}?apiKey=${STOCK_API_KEY}`;
  
  return fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      }
      return response.json();
    })
    .then((data) => {
      if (data.results && data.results.length > 0) {
        return data.results;
      } else {
        throw new Error("No stock data available");
      }
    })
    .catch((error) => {
      console.error("Error fetching stock data:", error);
      throw error;
    });
}

// Variable to store chart instance
let stockChartInstance = null;

async function fetchStockData() {
  try {
    const daysToLookBack = parseInt(document.getElementById("timeRange").value);
    const stockSymbol = document.getElementById("stockSymbol").value;
    
    if (!stockSymbol) {
      alert("Please enter a stock symbol");
      return;
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToLookBack);
    
    // Fetch stock data
    const stockData = await fetchStockPriceData(
      stockSymbol,
      startDate.getTime(),
      endDate.getTime()
    );
    
    // Prepare data for chart
    const dates = [];
    const prices = [];
    
    stockData.forEach(item => {
      dates.push(new Date(item.t).toLocaleDateString());
      prices.push(item.c); // Closing price
    });
    
    // Get chart canvas
    const chartCanvas = document.getElementById("stockChart");
    
    // Destroy existing chart if it exists
    if (stockChartInstance) {
      stockChartInstance.destroy();
    }
    
    // Create new chart
    stockChartInstance = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: `${stockSymbol.toUpperCase()} Price`,
            data: prices,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Price ($)"
            }
          },
          x: {
            title: {
              display: true,
              text: "Date"
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error in fetchStockData:", error);
    alert(`Error fetching stock data: ${error.message}`);
  }
}

// Dog Functions
function fetchRandomDogImages(count = 10) {
  return fetch(`https://dog.ceo/api/breeds/image/random/${count}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch dog images");
      }
      return response.json();
    })
    .then((data) => {
      return data.message;
    })
    .catch((error) => {
      console.error("Error fetching dog images:", error);
      return [];
    });
}

async function loadDogImages() {
  try {
    const dogImages = await fetchRandomDogImages();
    const sliderContainer = document.getElementById("dogImageSlider");
    
    if (dogImages.length === 0) {
      sliderContainer.innerHTML = "<p>No dog images available</p>";
      return;
    }
    
    // Clear existing content
    sliderContainer.innerHTML = "";
    
    // Add images to slider
    dogImages.forEach(imageUrl => {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.width = 300;
      img.height = 300;
      img.style.objectFit = "cover";
      sliderContainer.appendChild(img);
    });
    
    // Initialize slider
    if (window.simpleslider && typeof window.simpleslider.getSlider === "function") {
      window.simpleslider.getSlider();
    }
    
    // Load dog breed information
    loadDogBreedList();
  } catch (error) {
    console.error("Error in loadDogImages:", error);
    document.getElementById("dogImageSlider").innerHTML = "<p>Error loading dog images</p>";
  }
}

function fetchDogBreeds() {
  return fetch("https://dogapi.dog/api/v2/breeds")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch dog breeds");
      }
      return response.json();
    })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.error("Error fetching dog breeds:", error);
      return { data: [] };
    });
}

async function loadDogBreedList() {
  try {
    const breedData = await fetchDogBreeds();
    const buttonContainer = document.getElementById("dogButtons");
    
    if (!breedData.data || breedData.data.length === 0) {
      buttonContainer.innerHTML = "<p>No breed information available</p>";
      return;
    }
    
    // Clear existing content
    buttonContainer.innerHTML = "";
    
    // Add breed buttons
    breedData.data.forEach(breed => {
      const button = document.createElement("button");
      button.textContent = breed.attributes.name;
      button.value = breed.attributes.name;
      button.addEventListener("click", () => {
        displayBreedInfo(breed.attributes.name);
      });
      buttonContainer.appendChild(button);
    });
  } catch (error) {
    console.error("Error in loadDogBreedList:", error);
    document.getElementById("dogButtons").innerHTML = "<p>Error loading breed list</p>";
  }
}

async function displayBreedInfo(breedName) {
  try {
    const breedData = await fetchDogBreeds();
    const infoContainer = document.getElementById("breedInfo");
    
    // Clear existing content
    infoContainer.innerHTML = "";
    infoContainer.style.backgroundColor = "white";
    
    // Find the breed in the data
    const breed = breedData.data.find(
      item => item.attributes.name.toLowerCase() === breedName.toLowerCase()
    );
    
    if (!breed) {
      infoContainer.innerHTML = `<p>No information found for ${breedName}</p>`;
      return;
    }
    
    // Create breed information elements
    const header = document.createElement("h2");
    header.textContent = breed.attributes.name;
    
    const description = document.createElement("p");
    description.textContent = `Description: ${breed.attributes.description || "No description available"}`;
    
    const lifespan = document.createElement("p");
    if (breed.attributes.life) {
      lifespan.textContent = `Lifespan: ${breed.attributes.life.min || "?"} - ${breed.attributes.life.max || "?"} years`;
    } else {
      lifespan.textContent = "Lifespan: Information not available";
    }
    
    // Add elements to container
    infoContainer.appendChild(header);
    infoContainer.appendChild(description);
    infoContainer.appendChild(lifespan);
  } catch (error) {
    console.error("Error in displayBreedInfo:", error);
    document.getElementById("breedInfo").innerHTML = `<p>Error loading information for ${breedName}</p>`;
  }
}

// Voice Command Functions
function enableVoiceCommands() {
  if (annyang) {
    // Define commands
    const commands = {
      "hello": () => {
        alert("Hello! How can I help you?");
      },
      "navigate to *page": (page) => {
        if (page.toLowerCase().includes("home")) {
          navigateToHome();
        } else if (page.toLowerCase().includes("stock")) {
          navigateToStocks();
        } else if (page.toLowerCase().includes("dog")) {
          navigateToDogs();
        }
      },
      "change color to *color": (color) => {
        document.body.style.backgroundColor = color;
      }
    };
    
    // Add commands to annyang
    annyang.addCommands(commands);
    
    // Start listening
    annyang.start({ autoRestart: false });
    alert("Voice commands enabled");
  } else {
    alert("Speech recognition is not supported in your browser");
  }
}

function enableStockVoiceCommands() {
  if (annyang) {
    // Define commands
    const commands = {
      "hello": () => {
        alert("Hello! How can I help you?");
      },
      "navigate to *page": (page) => {
        if (page.toLowerCase().includes("home")) {
          navigateToHome();
        } else if (page.toLowerCase().includes("stock")) {
          navigateToStocks();
        } else if (page.toLowerCase().includes("dog")) {
          navigateToDogs();
        }
      },
      "change color to *color": (color) => {
        document.body.style.backgroundColor = color;
      },
      "look up *symbol": (symbol) => {
        document.getElementById("stockSymbol").value = symbol;
        fetchStockData();
      }
    };
    
    // Add commands to annyang
    annyang.addCommands(commands);
    
    // Start listening
    annyang.start({ autoRestart: false });
    alert("Voice commands enabled");
  } else {
    alert("Speech recognition is not supported in your browser");
  }
}

function enableDogVoiceCommands() {
  if (annyang) {
    // Define commands
    const commands = {
      "hello": () => {
        alert("Hello! How can I help you?");
      },
      "navigate to *page": (page) => {
        if (page.toLowerCase().includes("home")) {
          navigateToHome();
        } else if (page.toLowerCase().includes("stock")) {
          navigateToStocks();
        } else if (page.toLowerCase().includes("dog")) {
          navigateToDogs();
        }
      },
      "change color to *color": (color) => {
        document.body.style.backgroundColor = color;
      },
      "look up breed *breed": (breed) => {
        displayBreedInfo(breed);
      }
    };
    
    // Add commands to annyang
    annyang.addCommands(commands);
    
    // Start listening
    annyang.start({ autoRestart: false });
    alert("Voice commands enabled");
  } else {
    alert("Speech recognition is not supported in your browser");
  }
}

function disableVoiceCommands() {
  if (annyang) {
    annyang.abort();
    alert("Voice commands disabled");
  }
}
