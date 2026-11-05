import { test as base } from "playwright-bdd";
import { LoginPage } from "../pages/LoginPage.js";
import { ExcelReader } from "../utils/ExcelReader.js";
import { logger } from "../utils/logger.js";

export const test = base.extend({

    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    excelReader: async ({}, use) => {
        const excelReader = new ExcelReader(process.env.EXCEL_PATH);
        await use(excelReader);
    },

   logger: async ({}, use) => {
        await use(logger);
    }

});

