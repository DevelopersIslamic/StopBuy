$(document).ready(function() {
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

        var product = products.find(product => product.name && product.name.toLowerCase() === query);
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

    // Other existing functions
    var _scannerIsRunning = false;
    var _processingBarcode = false; // New flag to control processing

    function startScanner() {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                let videoDevices = devices.filter(device => device.kind === 'videoinput');
                let defaultDevice = videoDevices[0].deviceId;

                Quagga.init({
                    inputStream: {
                        name: "Live",
                        type: "LiveStream",
                        target: document.querySelector('#scanner-container'),
                        constraints: {
                            deviceId: defaultDevice,
                            width: 640,
                            height: 480,
                            facingMode: "environment"
                        },
                    },
                    decoder: {
                        readers: [
                            "ean_reader",
                            "ean_8_reader",
                            "upc_reader",
                            "upc_e_reader",
                        ],
                        debug: false,
                    },
                    locate: true,
                    locator: {
                        patchSize: "medium",
                        halfSample: true
                    },
                }, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    console.log("Initialization finished. Ready to start");
                    Quagga.start();

                    // Set flag to is running
                    _scannerIsRunning = true;
                });

                Quagga.onProcessed(function (result) {
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

                Quagga.onDetected(function (result) {
                    console.log("Barcode detected and processed : [" + result.codeResult.code + "]", result);
                    if (!_processingBarcode) {
                        _processingBarcode = true; // Prevent multiple detections
                        document.getElementById('result').innerText = "Checking product...";
                        checkBarcode(result.codeResult.code);
                    }
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

    // Make the function global by attaching it to window
    window.openTab = function(evt, tabName) {
        var i, tabcontent, tablinks;

        // Hide all tabcontent elements
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }

        // Remove the 'active' class from all tablinks
        tablinks = document.getElementsByClassName("tablink");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }

        // Show the current tab and add an 'active' class to the button that opened the tab
        document.getElementById(tabName).style.display = "block";
        if (evt) {
            evt.currentTarget.className += " active";
        }

        if (tabName === 'barcode-tab') {
            startScanner();
        } else {
            if (_scannerIsRunning) {
                Quagga.stop();
                _scannerIsRunning = false;
            }
        }
    }

    // Function to load the top 100 boycotted products
    function loadTopProducts() {
        if (!products || products.length === 0) {
            console.log("Products array is not defined or empty.");
            return;
        }

        var topProducts = products.filter(product => product.isBoicoted).slice(0, 100);
        var topProductsHTML = topProducts.map(product => `<li>${product.name}</li>`).join('');
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
        audio.play();
        
        // Simulate a server request
        setTimeout(() => {
            var product = products.find(product => product.barcode === barcode);
            if (product) {
                if (product.isBoicoted) {
                    document.getElementById('result').innerText = `Boycotted product detected: ${product.name} (Barcode: ${product.barcode})`;
                    setTimeout(() => {
                        document.getElementById('result').innerText = "Scan a barcode";
                        _processingBarcode = false; // Allow new detection after 5 seconds
                    }, 5000); // Show the message for 5 seconds
                } else {
                    document.getElementById('result').innerText = `Product not boycotted: ${product.name} (Barcode: ${product.barcode})`;
                    _processingBarcode = false; // Allow new detection
                }
            } else {
                document.getElementById('result').innerText = `Product not found: ${barcode}`;
                _processingBarcode = false; // Allow new detection
            }
        }, 1000); // Simulate a delay in the request
    }

    // Call load functions on document ready
    loadTopProducts();
    loadLatestNews();
});