import ejs from 'ejs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const renderPage = async (page_name, data = {}) => {
        return await ejs.renderFile(
        path.join(__dirname, `../views/pages/${page_name}.ejs`), { data: data}
    );
}

export default renderPage