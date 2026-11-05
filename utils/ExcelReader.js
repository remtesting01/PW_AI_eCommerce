import XLSX from "xlsx";

export class ExcelReader {

  constructor(filePath) {

    this.workbook = XLSX.readFile(filePath);

  }

  getExcelData(sheetName, testCase) {

    const worksheet = this.workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(worksheet);

    const row = data.find((row) => row.testCase === testCase);

    return row;

  }

}