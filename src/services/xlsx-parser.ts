import * as XLSX from 'xlsx';
import { WorkSheet } from 'xlsx';

const START_OF_DATE_COLUMN = 'F';
const OBJECT_FIRST_ROW = 3;
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

const WORKING_COLORS = ['00BFFF', '0DC0FF'];
const FINISH_WORKING_COLORS = ['FFFF00'];
const ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

export enum WorkingStatusEnum {
  START,
  WORKING,
  FINISH,
  PENDING,
}

export type HourData = {
  status: WorkingStatusEnum;
  valueNum?: number;
  value?: string;
};

export type ReadResult = {
  [key: string]: {
    [key: string]: HourData[];
  };
};

class XlsxParser {
  private book: XLSX.WorkBook | null = null;
  private mainSheet: WorkSheet | null = null;
  private datesCells: {
    value: string;
    range: XLSX.Range;
    rangeCode: string;
    rangeCells: string[];
  }[] = [];
  private options: XLSX.ParsingOptions = {
    type: 'array',
    sheets: SHEET_NAME,
    cellStyles: true,
    sheetStubs: true,
    FS: '||||',
  };
  private radarNamesToCellMap: { fullName: string; row: number }[] = [];
  public maxDayOfMonth = 1;

  // @ts-ignore
  read(data: Uint8Array<ArrayBuffer>): ReadResult {
    const readResult = XLSX.read(data, this.options);
    this.book = readResult;
    this.mainSheet = this.book!.Sheets[SHEET_NAME];

    if (!this.mainSheet || !this.mainSheet['!merges']) {
      alert('Error');
      return {};
    }

    const dateCells = this.mainSheet['!merges']
      .filter(
        (item) =>
          item.e.r === 0 && item.s.c >= ALPHABET.indexOf(START_OF_DATE_COLUMN)
      )
      .sort((a, b) => a.s.c - b.s.c)
      .map((range) => {
        const rangeCells: string[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const letter = XLSX.utils.encode_col(C);
          rangeCells.push(letter);
        }
        const dateValue =
          this.mainSheet?.[`${XLSX.utils.encode_col(range.s.c)}1`]?.w;
        return {
          value: isNaN(new Date(dateValue).getTime())
            ? `Невідома дата: ${dateValue}`
            : dateValue,
          range,
          rangeCells,
          rangeCode: XLSX.utils.encode_range(range),
        };
      })
      .reduce((acc, curr) => {
        const value = curr.value;

        if (acc[value]) return acc;

        return {
          ...acc,
          [value]: curr,
        };
      }, {});

    this.datesCells = Object.values(dateCells);

    this.go();
    return this.run();
  }

  go() {
    if (!this.mainSheet || !this.mainSheet['!merges']) {
      alert('Error');
      return;
    }
    const maxRow = Number(
      this.mainSheet['!ref']?.split(':')[1].replace(/\D/g, '')
    );
    for (let row = OBJECT_FIRST_ROW; row <= maxRow; row++) {
      const name = this.mainSheet[`${RLS_NAME_COLUMN}${row}`]?.v;
      const location = this.mainSheet[`${RLS_LOC_NAME_COLUMN}${row}`]?.v;
      const isBlackListName = RLS_NAMES_BLACKLIST.some(
        (rlsName) => rlsName?.toLowerCase() === name?.toLowerCase()
      );
      if (name && !isBlackListName) {
        this.radarNamesToCellMap.push({
          fullName: `${name}(${location})`,
          row,
        });
      }
    }
  }

  run(): ReadResult {
    return this.radarNamesToCellMap.reduce((accName, { fullName, row }) => {
      const dataForDate = this.datesCells.reduce(
        (accDates, { value, rangeCells }) => {
          const datesData = rangeCells.map((col) => {
            return this.parseWorking(this.mainSheet?.[`${col}${row}`]);
          });

          return { ...accDates, [value]: datesData };
        },
        {}
      );

      return {
        ...accName,
        [fullName]: dataForDate,
      };
    }, {});
  }

  parseWorking(cell: XLSX.CellObject) {
    const fgColor: string = cell?.s?.fgColor?.rgb || '';

    let status = WorkingStatusEnum.PENDING;

    const isStartStatus =
      cell?.v && WORKING_COLORS.includes(fgColor.toUpperCase());

    if (isStartStatus) status = WorkingStatusEnum.START;

    const isWorkingStatus =
      !cell?.v && WORKING_COLORS.includes(fgColor.toUpperCase());

    if (isWorkingStatus) status = WorkingStatusEnum.WORKING;

    const isFinishWorkingStatus =
      cell?.v && FINISH_WORKING_COLORS.includes(fgColor.toUpperCase());

    if (isFinishWorkingStatus) status = WorkingStatusEnum.FINISH;

    return {
      status,
      valueNum: cell?.v,
      value: cell?.w,
    };
  }
}

export const xlsxParser = new XlsxParser();
