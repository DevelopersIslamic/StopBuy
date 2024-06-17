let currentSlide = 0;
let isScanning = true;  // Flag to control scanning state
let audioPlayed = false;  // New flag to control audio playback

function changeSlide(n) {
    showSlide(currentSlide += n);
}

function showSlide(n) {
    let slides = document.getElementsByClassName("slide");
    if (n >= slides.length) {
        currentSlide = 0;
    }
    if (n < 0) {
        currentSlide = slides.length - 1;
    }
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slides[currentSlide].style.display = "block";
}

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

$(document).ready(function() {
    showSlide(currentSlide);

    // Real-time search
    $('#searchInput').on('input', function() {
        var query = $(this).val().toLowerCase();
        searchProduct(query);
    });

    // Function to search products by name
    function searchProduct(query) {
        if (!products || products.length === 0) {
            console.log("Products array is not defined or empty.");
            return;
        }

        var product = products.find(product => product.name && product.name.toLowerCase().includes(query));
        var resultMessage;

        if (product) {
            if (product.isBoicoted) {
                resultMessage = `Boycotted: ${product.name}`;
            } else {
                resultMessage = `Product not boycotted: ${product.name}`;
            }
        } else {
            resultMessage = "Product not found";
        }

        $('#searchResultMessage').html(resultMessage);
    }

    // Function to load the top 100 boycotted products
    function loadTopProducts() {
        if (!products || products.length === 0) {
            console.log("Products array is not defined or empty.");
            return;
        }

        var topProducts = products.filter(product => product.isBoicoted).slice(0, 100);
        var topProductsHTML = topProducts.map(product => `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p>Barcode: ${product.barcode}</p>
            </div>
        `).join('');
        $('#topProducts').html(topProductsHTML);
    }

    // Function to load the latest news
    function loadLatestNews() {
        var news = [
            {
                title: "Company X added to the boycott list",
                content: "Company X has been recently added to the boycott list due to its continuous support...",
                link: "#"
            },
            {
                title: "New boycott campaign launched",
                content: "A new campaign has been launched to boycott products from...",
                link: "#"
            }
        ];

        var newsHTML = news.map(item => `
            <div class="news-item">
                <h3>${item.title}</h3>
                <p>${item.content}</p>
                <a href="${item.link}">Read more</a>
            </div>
        `).join('');
        $('#newsContent').html(newsHTML);
    }

    // Function to check if the barcode is in the boycotted products list
    function checkBarcode(barcode) {
        var audio = document.getElementById('barcode-sound');
        
        // Simulate a server request
        setTimeout(() => {
            var product = products.find(product => product.barcode === barcode);
            if (product) {
                if (product.isBoicoted) {
                    document.getElementById('result').innerText = `Boycotted product detected: ${product.name} (Barcode: ${product.barcode})`;
                    document.getElementById('result').classList.add('boicoted');
                    
                    // Play audio continuously for 5 seconds
                    let audioInterval = setInterval(() => {
                        audio.play();
                    }, 100); // Play audio every 200 milliseconds

                    setTimeout(() => {
                        clearInterval(audioInterval); // Stop the audio after 5 seconds
                        document.getElementById('result').innerText = "Scan a barcode";
                        document.getElementById('result').classList.remove('boicoted');
                        isScanning = true;  // Re-enable scanning after 5 seconds
                    }, 3000); // Show the message for 5 seconds

                } else {
                    document.getElementById('result').innerText = `Product not boycotted: ${product.name} (Barcode: ${product.barcode})`;
                    isScanning = true;  // Re-enable scanning immediately for non-boycotted products
                }
            } else {
                document.getElementById('result').innerText = `Product not found: ${barcode}`;
                isScanning = true;  // Re-enable scanning immediately for not found products
            }
        }, 1000); // Simulate a delay in the request
    }

    // Function to start the scanner
    function startScanner() {
        scrollToSection('scanner-section');
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(function(stream) {
                var video = document.querySelector('video');
                video.srcObject = stream;
                video.play();
                
                Quagga.init({
                    inputStream: {
                        name: "Live",
                        type: "LiveStream",
                        target: video, 
                        constraints: {
                            facingMode: "environment"
                        },
                    },
                    decoder: {
                        readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"]
                    },
                }, function(err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log("Initialization finished. Ready to start");
                    Quagga.start();
                });

                Quagga.onProcessed(function(result) {
                    var drawingCtx = Quagga.canvas.ctx.overlay,
                        drawingCanvas = Quagga.canvas.dom.overlay;

                    if (result) {
                        if (result.boxes) {
                            drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                            result.boxes.filter(function (box) {
                                return box !== result.box;
                            }).forEach(function (box) {
                                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
                            });
                        }

                        if (result.box) {
                            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
                        }

                        if (result.codeResult && result.codeResult.code) {
                            Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
                        }
                    }
                });

                Quagga.onDetected(function(result) {
                    if (isScanning) {
                        isScanning = false;  // Disable scanning
                        var code = result.codeResult.code;
                        console.log("Barcode detected: " + code);
                        checkBarcode(code);
                    }
                });
            })
            .catch(function(err) {
                console.log(err);
            });
    }

    // Make the functions global
    window.scrollToSection = scrollToSection;
    window.startScanner = startScanner;
    window.changeSlide = changeSlide;

    // Load content on document ready
    loadTopProducts();
    loadLatestNews();
});