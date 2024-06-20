$(document).ready(function() {
    window.scrollToSection = function(sectionId) {
        document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    };

    window.setLanguage = function(language) {
        // Implement the logic to set the language here
        if (language === 'en') {
            // Set the text to English
            $("[data-translate-key]").each(function() {
                var key = $(this).data("translate-key");
                $(this).text(languages.en[key]);
            });
        } else if (language === 'ar') {
            // Set the text to Arabic
            $("[data-translate-key]").each(function() {
                var key = $(this).data("translate-key");
                $(this).text(languages.ar[key]);
            });
        }
    };

    let scannerStarted = false;
    let isScanning = true; // Flag to control the scanning state

    window.startScanner = function() {
        scrollToSection('scanner-section');
        if (scannerStarted) return;

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(function(stream) {
                var video = document.querySelector('video');
                video.srcObject = stream;
                video.play();
                scannerStarted = true;

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
                    locate: true
                }, function(err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
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
                    if (isScanning) { // Only process if scanning is enabled
                        var code = result.codeResult.code;
                        checkBarcode(code);
                    }
                });
            })
            .catch(function(err) {
                console.log(err);
            });
    };

    function checkBarcode(barcode) {
        var audio = document.getElementById('barcode-sound');

        // Simulate a server request
        setTimeout(() => {
            var product = products.find(product => product.barcode === barcode);
            if (product) {
                if (product.isBoicoted) {
                    document.getElementById('result').innerText = `Boycotted product detected: ${product.name} (Barcode: ${product.barcode})`;
                    document.getElementById('result').classList.add('boicoted');

                    // Play audio continuously for 3 seconds
                    let audioInterval = setInterval(() => {
                        audio.play();
                    }, 50); // Play audio every 100 milliseconds

                    isScanning = false; // Stop scanning

                    setTimeout(() => {
                        clearInterval(audioInterval); // Stop playing audio after 3 seconds
                        document.getElementById('result').innerText = "Scan a barcode";
                        document.getElementById('result').classList.remove('boicoted');
                        setTimeout(() => {
                            audio.pause();
                            audio.currentTime = 0;
                            isScanning = true; // Resume scanning after 1 second
                        }, 1000);
                    }, 3000);

                } else {
                    document.getElementById('result').innerText = `Product not boycotted: ${product.name} (Barcode: ${product.barcode})`;
                }
            } else {
                document.getElementById('result').innerText = `Product not found: ${barcode}`;
            }
        }, 1000);
    }

    function loadTopProducts() {
        if (!products || products.length === 0) {
            console.log("Products array is not defined or empty.");
            return;
        }

        var topProducts = products.filter(product => product.isBoicoted).slice(0, 100);
        var topProductsHTML = topProducts.map(product => `
            <div class="col-md-4 mb-3">
                <div class="product-card p-3">
                    <h3>${product.name}</h3>
                    <p>Barcode: ${product.barcode}</p>
                </div>
            </div>
        `).join('');
        $('#topProducts').html(topProductsHTML);
    }

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
            <div class="news-item mb-3">
                <h3>${item.title}</h3>
                <p>${item.content}</p>
                <a href="${item.link}" class="btn btn-link">Read more</a>
            </div>
        `).join('');
        $('#newsContent').html(newsHTML);
    }

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
                $('#searchResultMessage').addClass('text-danger').removeClass('text-success');
            } else {
                resultMessage = `Product not boycotted: ${product.name}`;
                $('#searchResultMessage').addClass('text-success').removeClass('text-danger');
            }
        } else {
            resultMessage = "Product not found";
            $('#searchResultMessage').removeClass('text-success text-danger');
        }

        $('#searchResultMessage').html(resultMessage);
    }

    $('#searchInput').on('input', function() {
        var query = $(this).val().toLowerCase();
        searchProduct(query);
    });

    loadTopProducts();
    loadLatestNews();
});