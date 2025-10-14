import { addDays, format } from 'date-fns';
import * as XLSX from 'xlsx';
import { WorkSheet } from 'xlsx';

const CELL_NAME_REGEXP = new RegExp('([A-Z]{1,4})([0-9]{1,3})$');
const TIME_HEADER_CELL_REGEXP = new RegExp('^([A-Z]{1,4})2$');
const AMOUNT_OF_HOURS_IN_DAY = 24;
const OBJECT_FIRST_ROW = 4;
const SKIP_COLUMNS = ['A', 'B'];
const SHEET_NAME = 'РЛС';
const RLS_NAME_COLUMN = 'C';
const RLS_LOC_NAME_COLUMN = 'D';
const RLS_NAMES_BLACKLIST = [
  'РЛС РТВ та ЗРВ',
  'РЛС ЗРВ МД',
  'РЛС БСС',
  'Станція КРЕО №4',
  'Станція КРЕО №2',
  'РЛС РТВ та ЗРВ ',
];
const WORKING_COLORS = ['00BFFF', 'FFFF00', '0DC0FF'];

class XlsxParser {
  private book: XLSX.WorkBook | null = null;
  private options: XLSX.ParsingOptions = {
    type: 'array',
    sheets: SHEET_NAME,
    cellStyles: true,
    sheetStubs: true,
    FS: '||||',
  };
  private countDayChanged: number = 0;
  private prevDay: number = 0;
  private timeColumns: Record<string, WorkSheet> = {};
  private dates: Array<Date | 'placeholder'> = [];
  private maxRow: number = 0;
  public maxDayOfMonth = 1;

  private inputValidator() {
    console.log();
    if (!this.book || !this.book?.Sheets?.[SHEET_NAME]) {
      alert('Відсутній файл, або завантажено не коректний файл');
      throw new Error();
    }
  }

  read(data: Uint8Array<ArrayBuffer>) {
    const readResult = XLSX.read(data, this.options);
    this.book = readResult;
    console.log(this.book);
    this.collectTimeColumns();
    this.getColumnKeys();
    return this.parseWorking();
  }

  collectTimeColumns() {
    this.inputValidator();
    const timeColumns: [string, WorkSheet][] = [];
    let prevDate: Date | null = null;
    Object.entries(this.book!.Sheets[SHEET_NAME]).forEach(
      ([cellName, cellData]) => {
        const isTimeHeadCell = TIME_HEADER_CELL_REGEXP.test(cellName);
        if (cellData?.z === 'm/d/yy') {
          console.log(cellName);
          if (cellData.w) {
            const date = new Date(cellData.w);
            const isValidDate = !isNaN(date.getTime());
            if (isValidDate) {
              prevDate = date;
              this.dates.push(date);
              const placeholderIndex = this.dates.indexOf('placeholder');
              if (placeholderIndex >= 0) {
                const placeholderDate = addDays(date, -1);
                this.dates[placeholderIndex] = placeholderDate;
              }
            } else if (!isValidDate && prevDate) {
              const nextDate = addDays(prevDate, 1);
              this.dates.push(nextDate);
            }
          } else {
            if (prevDate) {
              const nextDate = addDays(prevDate, 1);
              this.dates.push(nextDate);
            } else {
              this.dates.push('placeholder');
            }
          }
        }
        if (cellData.z === 'h:mm' && cellData.v >= 0 && isTimeHeadCell) {
          if (this.countDayChanged === 0) {
            this.prevDay++;
          }
          this.countDayChanged++;
          if (this.countDayChanged === AMOUNT_OF_HOURS_IN_DAY) {
            this.countDayChanged = 0;
          }
          cellData.dayOfMonth = this.prevDay;
          timeColumns.push([cellName, cellData]);
        }
        this.countRowsAmount(cellName);
      }
    );
    this.timeColumns = Object.fromEntries(timeColumns);
    console.log(this.dates);
  }

  countRowsAmount(cellName: string) {
    const cellRow = CELL_NAME_REGEXP.exec(cellName);
    if (cellRow) {
      if (+cellRow[2] > this.maxRow) {
        this.maxRow = +cellRow[2];
      }
    }
  }

  private getColumnKeys() {
    return [
      ...new Set(
        Object.keys(this.book!.Sheets[SHEET_NAME])
          .filter((key) => CELL_NAME_REGEXP.exec(key))
          .map((key) => CELL_NAME_REGEXP.exec(key)?.[1])
      ),
    ];
  }

  parseWorking() {
    const result = [];
    const data = this.book!.Sheets[SHEET_NAME];
    for (let i = OBJECT_FIRST_ROW; i < this.maxRow; i++) {
      const name: string | undefined =
        data[`${RLS_NAME_COLUMN}${i}`]?.v +
        ' ' +
        data[`${RLS_LOC_NAME_COLUMN}${i}`]?.v;
      if (!name || RLS_NAMES_BLACKLIST.includes(name)) continue;

      let currentTime: WorkSheet | null = null;
      let currentDay: Date | 'placeholder' | null = null;
      const dates: string[] = [];
      const rowResult = this.getColumnKeys().reduce(
        (acc, curr) => {
          if (curr && SKIP_COLUMNS.includes(curr)) {
            return acc;
          }
          if (this.timeColumns[`${curr}2`]) {
            currentTime = this.timeColumns[`${curr}2`];
            currentDay = this.dates[currentTime.dayOfMonth - 1];
          } else {
            return acc;
          }

          const color = data[`${curr}${i}`]?.s?.fgColor?.rgb;
          const isWorking = WORKING_COLORS.includes(color);

          if (!currentDay) {
            return acc;
          }

          const date = format(currentDay as Date, 'dd.LL.yyyy');

          if (!dates.includes(date)) {
            dates.push(date);
          }
          acc.name = name;
          const workingForThisDate = acc.working.get(date) || [];
          acc.working.set(date, [
            ...workingForThisDate,
            {
              isWorking,
              currentTime: currentTime?.w,
              currentDay: format(currentDay as Date, 'dd.LL.yyyy'),
              cellId: `${curr}${i}`,
              key: dates.length,
            },
          ]);

          if (currentTime?.w === '23:00') {
            acc.working.set(date, [
              ...acc.working.get(date),
              {
                isWorking,
                currentTime: '24:00',
                currentDay: format(currentDay as Date, 'dd.LL.yyyy'),
                cellId: `${curr}${i}`,
                key: dates.length,
              },
            ]);
          }

          return acc;
        },
        {
          name: '',
          working: new Map(),
        }
      );
      result[i] = rowResult;
    }
    return result.filter(Boolean);
  }
}

export const xlsxParser = new XlsxParser();
