import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";


/**
 * 
 * @param {String} template template name save in templates folder without .ejs extension
 * @param {Object} data pdf data
 * @returns pdf
 */
export const generatePDF = async (template, data) => {
    const templatePath = path.join(
        process.cwd(),
        `src/reports/templates/${template}.ejs`
    );

    const html = await ejs.renderFile(templatePath, { data });

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
            top: "20px",
            bottom: "20px",
            left: "20px",
            right: "20px"
        }
    });

    await browser.close();
    return pdfBuffer;
};
