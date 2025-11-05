import { format, parse } from 'date-fns';
import React, { ChangeEvent, useState } from 'react';
import {
  HourData,
  ReadResult,
  WorkingStatusEnum,
  xlsxParser,
} from '../services/xlsx-parser';

const hoursArr = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23,
];

function normalizeHours(value: number) {
  const hour = Math.floor(value);
  const padded = hour.toString().padStart(2, '0');
  return `${padded}:00`;
}

function normalizeDate(input: string) {
  if (isNaN(new Date(input).getTime())) return input;
  const parsedDate = parse(input, 'M/d/yy', new Date());
  const formatted = format(parsedDate, 'dd.MM.yyyy');

  return formatted;
}

function getBackgroundByStatus(dateData: HourData) {
  const base = 'linear-gradient';

  if (dateData.status === WorkingStatusEnum.PENDING) {
    return `${base}(to left, #fff)`;
  } else if (dateData.status === WorkingStatusEnum.WORKING) {
    return `${base}(to left, #ff000090 100%)`;
  } else if (dateData.status === WorkingStatusEnum.START) {
    const percent = (dateData?.valueNum || 1) * 100;
    const left = 100 - percent;
    return `${base}(to left, #ff000090 ${left}%, #fff ${left}%)`;
  } else if (dateData.status === WorkingStatusEnum.FINISH) {
    const percent = (dateData?.valueNum || 1) * 100;
    const left = 100 - percent;
    const right = 100 - left;
    return `${base}(to right, #ff000090 ${right}%, #fff ${right}%)`;
  }

  return 'none';
}

export default function Home() {
  const [data, setData] = useState<ReadResult>({});

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      alert('Щось не так із завантаженим файлом. Не можу його прочитати!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt?.target?.result) {
        const fileData = new Uint8Array(
          evt.target.result as ArrayBuffer | ArrayLike<number>
        );
        const readResult = xlsxParser.read(fileData);

        setData(readResult);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <div>
        <input type="file" onChange={handleFile} accept=".xlsx, .xlsm" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '70%' }}>
          {Object.entries(data).map(([radarName, workingData]) => {
            return (
              <div key={radarName}>
                <h3 id={radarName}>{radarName}</h3>
                <table
                  style={{
                    borderCollapse: 'collapse',
                    borderSpacing: 0,
                  }}>
                  <tbody>
                    {
                      <tr>
                        {hoursArr.map((hour, i) => {
                          return (
                            <React.Fragment key={hour}>
                              {i === 0 ? <td></td> : null}
                              <td
                                style={{
                                  width: 40,
                                  height: 60,
                                  border: '1px solid black',
                                  background: '#00000050',
                                }}>
                                {normalizeHours(hour)}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    }

                    {Object.entries(workingData).map(([date, dataByDate]) => {
                      return (
                        <tr key={`${radarName}_${date}`}>
                          {dataByDate.map((hourData, i) => {
                            return (
                              <React.Fragment key={`${radarName}_${date}_${i}`}>
                                {i === 0 ? (
                                  <td
                                    style={{
                                      textAlign: 'right',
                                      paddingRight: 3,
                                    }}>
                                    {normalizeDate(date)}
                                  </td>
                                ) : null}
                                <td
                                  style={{
                                    width: 40,
                                    height: 20,
                                    border: '1px solid black',
                                    backgroundImage:
                                      getBackgroundByStatus(hourData),
                                  }}></td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        <ul style={{ width: '20%', position: 'fixed', right: 10, top: 10 }}>
          {Object.keys(data).map((radarName) => {
            return (
              <li>
                <a href={`#${radarName}`}>{radarName}</a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
