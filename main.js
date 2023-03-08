

function addRow() {
    var table = document.getElementById("expenses-table");
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);
    var rowNumber = rowCount - 1;

    // create cells
    var rowNumberCell = row.insertCell(0);
    var dateCell = row.insertCell(1);
    var descriptionCell = row.insertCell(2);
    var projectNumberCell = row.insertCell(3);
    var amountCell = row.insertCell(4);
    var fileCell = row.insertCell(5);
    var cell7 = row.insertCell(6);

    // add content to cells
    rowNumberCell.innerHTML = rowNumber;
    dateCell.innerHTML = '<input type="date" />';
    descriptionCell.innerHTML = '<input type="text" />';
    projectNumberCell.innerHTML = '<input type="text" />';
    amountCell.innerHTML = '<input type="number" class="amount" step="0.0001"  oninput="sumCells()"/>';
    fileCell.innerHTML = `
<div class="file-drop" ondragover="dragOver(event)" ondrop="dropFile(event, ${rowNumber})" onclick="document.getElementById('file-input-${rowNumber}').click()">
Drop a file here or click to upload
</div>
<input id="file-input-${rowNumber}" type="file" class="hidden" onchange="fileSelected(event, ${rowNumber})">
<img class="hidden" data-file="" />
`;

    var deleteButton = document.createElement("button");
    deleteButton.innerHTML = "Delete";
    deleteButton.onclick = function () {
        table.deleteRow(rowNumber);
    };
    cell7.appendChild(deleteButton);

}

function deleteRow(button) {
    var row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
}

function dragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
}

function dragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function dropFile(event, row) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
    event.currentTarget.classList.add('file-selected');
    var fileDrop = event.target;
    fileDrop.innerHTML = event.dataTransfer.files[0].name;
    var fileInput = document.getElementById(`file-input-${row}`);
    fileInput.files = event.dataTransfer.files;
    var img = fileDrop.nextSibling;
    img.setAttribute("data-file", event.dataTransfer.files[0].name);
}


function fileSelected(event, row) {
    event.preventDefault();
    event.stopPropagation();

    var fileDrop = document.querySelector(`#expenses-table tr:nth-child(${row + 1}) .file-drop`);
    fileDrop.innerHTML = event.target.files[0].name;

    fileDrop.classList.add('file-selected');

    var img = document.createElement("img");
    img.setAttribute("data-file", event.target.files[0].name);
    img.setAttribute("src", URL.createObjectURL(event.target.files[0]));

    img.style.display = "none";
    document.body.appendChild(img);
}

function mergeFiles() {
    window.jsPDF = window.jspdf.jsPDF;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
    });
    let fileNames = [];

    // Loop through each row in the table
    const rows = document.querySelectorAll("#expenses-table tbody tr");
    rows.forEach((row) => {
        const fileNameCell = row.querySelector(".file-drop");

        const fileName = fileNameCell.textContent.trim();

        if (fileName !== "") {
            fileNames.push(fileName);
        } else {
            alert("One receipt is missing.");
            return;
        }
    });

    if (fileNames.length > 0) {
        // Loop through each file name and add to doc
        fileNames.forEach((fileName) => {
            const imgData = document.querySelector(`img[data-file="${fileName}"]`);

            let _W = imgData.width
            let _H = imgData.height
            const maxHeight = 842
            const maxWidth = 595
            var ratio = Math.min(maxWidth / _W, maxHeight / _H);

            if (imgData.width > 595 || imgData.height > 842) {
                _W = _W * ratio
                _H = _H * ratio
            }

            console.log(imgData.width + " " + imgData.height)
            if (imgData) {
                doc.addImage(imgData.src, "JPEG", 10, 10, _W, _H);
                if (fileName !== fileNames[fileNames.length - 1]) {
                    doc.addPage();
                }
            } else {
                alert(`Image data for ${fileName} not found.`);
            }
        });

        // Download the merged file
        doc.save("Receipts.pdf");
    }
}


function generateFPage() {
    // Create a new jsPDF instance
    window.jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF('landscape');

    // Get the HTML content to be converted to PDF
    const table = document.getElementById("expenses-table");
    const inputs = document.getElementById("infos");

    // Calculate the width and height of the PDF page in pixels
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    // Calculate the scale factor for the HTML content to fit within the PDF page
    const scaleFactor = Math.min(pdfWidth / table.offsetWidth, pdfHeight / (inputs.offsetHeight + 20));

    // Generate the PDF
    doc.html(table, {
        x: 10,
        y: 30,
        callback: function () {
            // Add the second HTML content after the first one
            doc.addPage();
            doc.html(inputs, {
                x: 10,
                y: 10,
                callback: function () {
                    doc.save("FirstPage.pdf");
                },
                html2canvas: {
                    scale: scaleFactor
                }
            });
        },
        html2canvas: {
            scale: scaleFactor
        }
    });
}


function generateFULLPDF() {
    window.jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });
  
    // Get the HTML content to be converted to PDF
    const table = document.getElementById("fPageContent");
    const inputs = document.getElementById("infos");
  
    // Calculate the scale factor for the HTML content to fit within the PDF page
    const tableScaleFactor = Math.min(
      doc.internal.pageSize.getWidth() / table.offsetWidth,
      doc.internal.pageSize.getHeight() / (inputs.offsetHeight + 20)
    );
  
    // Generate the first page of the PDF
    doc.html(table, {
      x: 10,
      y: 20,
      html2canvas: {
        scale: tableScaleFactor,
      },
      callback: function () {
        doc.addPage('portrait');
  
        // Loop through each row in the table and add the corresponding image to the PDF
        const rows = document.querySelectorAll("#expenses-table tbody tr");
        rows.forEach((row) => {
          const fileNameCell = row.querySelector(".file-drop");
          const fileName = fileNameCell.textContent.trim();
  
          if (fileName !== "") {
            const imgData = document.querySelector(`img[data-file="${fileName}"]`);
  
            if (imgData) {
              let _W = imgData.width;
              let _H = imgData.height;
  
              // Scale the image to fit within the page if necessary
              const maxHeight = 842;
              const maxWidth = 595;
              const ratio = Math.min(maxWidth / _W, maxHeight / _H);
  
              if (_W > maxWidth || _H > maxHeight) {
                _W = _W * ratio;
                _H = _H * ratio;
              }
  
              doc.addImage(imgData.src, "JPEG", 10, 10, _W, _H);
              if (fileName !== rows[rows.length - 1].querySelector(".file-drop").textContent.trim()) {
                doc.addPage('portrait');
              }
            } else {
              alert(`Image data for ${fileName} not found.`);
            }
          } else {
            alert("One receipt is missing.");
            return;
          }
        });
        
        const _name= document.getElementById("name").value
        const _date= document.getElementById("date").value
        const _currency= document.getElementById("currency").value
        const _total= document.getElementById("total").value
        // Download the merged file
        doc.save("AP" + _name + "- T&Es " +  _date  + " - 2042 FR - " + _total + " " + _currency);
      },
    });
  }
  





  function sumCells() {
    const amounts = document.querySelectorAll('.amount');
    let sum = 0;
    amounts.forEach((amount) => {
      sum += parseFloat(amount.value) || 0;
    });
    document.getElementById("total").value = sum;
  }
  