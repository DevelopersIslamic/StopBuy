// Sound played when a barcode is scanned
var sound = new Audio("assets/audio/barcode.wav");

$(document).ready(function() {
    // Configuration for the barcode scanner
    barcode.config.start = 0.1;
    barcode.config.end = 0.9;
    barcode.config.video = '#barcodevideo';
    barcode.config.canvas = '#barcodecanvas';
    barcode.config.canvasg = '#barcodecanvasg';
    barcode.setHandler(function(barcode) {
        $('#result').html(barcode);
        checkProduct(barcode);
    });
    barcode.init();

    // Play sound when the barcode result is updated
    $('#result').bind('DOMSubtreeModified', function(e) {
        sound.play();    
    });

    // Real-time search
    $('#searchInput').on('input', function() {
        var query = $(this).val().toLowerCase();
        searchProduct(query);
    });
});

// Function to check if the scanned barcode exists in the product list
function checkProduct(scannedBarcode) {
    // Remove commas from the scanned barcode for comparison
    var sanitizedBarcode = scannedBarcode.replace(/,/g, '');
    var product = products.find(product => product.barcode.replace(/,/g, '') === sanitizedBarcode || product.name.toLowerCase() === sanitizedBarcode.toLowerCase());
    
    if (product) {
        if (sanitizedBarcode.startsWith("720") || product.isBoicoted) {
            $('#result').html(`Product is boicoted: ${product.name}`);
        } else {
            $('#result').html(`Product found: ${product.name}`);
        }
    } else {
        if (sanitizedBarcode.startsWith("720")) {
            $('#result').html('Product is boicoted');
        } else {
            $('#result').html('Product not found');
        }
    }
}

// Function to search products by name
function searchProduct(query) {
    var results = products.filter(product => product.name.toLowerCase().includes(query));
    var resultsHTML = results.map(product => {
        if (product.isBoicoted || product.barcode.startsWith("720")) {
            return `<li>Boicoted: ${product.name}</li>`;
        } else {
            return `<li>${product.name}</li>`;
        }
    }).join('');
    $('#searchResults').html(resultsHTML);
}
