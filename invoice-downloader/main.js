const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const luxon = require("luxon");
const Stripe = require("stripe");

dotenv.config();

// Get the first and last date of last month
const today = new Date();

async function downloadInvoicePdf(invoiceUrl, invoiceNumber, isPaid) {
  const response = await axios({
    url: invoiceUrl,
    method: "GET",
    responseType: "stream", // Download the PDF as a stream
  });

  // Ensure the folder exists
  const folderPath = "./invoices";
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  // Define the PDF path and write the file
  const filePath = path.join(folderPath, `${invoiceNumber}.pdf`);
  const writer = fs.createWriteStream(filePath);

  // Stream the PDF to the file system
  response.data.pipe(writer);

  const downloadPromise = new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });

  await downloadPromise;
  console.log(`Invoice ${invoiceNumber} saved to ${filePath}`);

  if (!isPaid) {
    console.log(`Invoice ${invoiceNumber} is unpaid`);
    // copy pdf to unpaid folder
    const unpaidFolderPath = "./invoices/unpaid";
    if (!fs.existsSync(unpaidFolderPath)) {
      fs.mkdirSync(unpaidFolderPath);
    }

    const unpaidFilePath = path.join(unpaidFolderPath, `${invoiceNumber}.pdf`);
    fs.copyFileSync(filePath, unpaidFilePath);
  }
}

async function fetchAndDownloadInvoices() {
  const stripe = new Stripe(process.env.STRIPE_API_KEY);
  let hasMore = true;
  let lastInvoiceId = null;

  try {
    const to = luxon.DateTime.now()
      .setZone("Europe/Bucharest")
      .minus({ months: 1 })
      .endOf("month");
    const from = to.startOf("month");
    while (hasMore) {
      const invoices = await stripe.invoices.list({
        created: {
          gte: Math.floor(from.toJSDate().getTime() / 1000), // Start of last month
          lte: Math.floor(to.toJSDate().getTime() / 1000), // End of last month
        },
        limit: 100, // Stripe's max per page
        ...(lastInvoiceId && { starting_after: lastInvoiceId }),
      });

      for (const invoice of invoices.data) {
        if (invoice.invoice_pdf) {
          const invoiceNumber = invoice.number || invoice.id;
          console.log(`Downloading invoice: ${invoiceNumber}`);
          await downloadInvoicePdf(
            invoice.invoice_pdf,
            invoiceNumber,
            invoice.paid
          );
        } else {
          console.error(`Invoice ${invoice.id} does not have a PDF`);
        }
      }

      // Check if there's more data to paginate
      hasMore = invoices.has_more;
      if (hasMore) {
        lastInvoiceId = invoices.data[invoices.data.length - 1].id;
      }
    }
  } catch (error) {
    console.error("Error fetching or downloading invoices:", error);
  }
}

// Start the invoice fetching and downloading process
fetchAndDownloadInvoices();
