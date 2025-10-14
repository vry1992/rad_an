import React, { ChangeEvent, useState } from 'react';
import { xlsxParser } from '../services/xlsx-parser';

const hoursArr = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22,
  21, 23, 24,
];

function normalizeHours(value: number) {
  const hour = Math.floor(value);
  const padded = hour.toString().padStart(2, '0');
  return `${padded}:00`;
}

export default function Home() {
  const [data, setData] = useState<
    Array<{
      name: string;
      working: Map<
        string,
        {
          isWorking: boolean;
          currentTime: string;
          currentDay: string;
          cellId: string;
        }[]
      >;
      value: [string, boolean][];
    }>
  >([]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0];
    if (!file || !file) {
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
    <div style={{ display: 'flex' }}>
      <div>
        <input type="file" onChange={handleFile} accept=".xlsx, .xlsm" />
        <div>
          {data.map((rls, i) => {
            return (
              <>
                <div key={rls.name}>
                  <h1 id={`${i}`} style={{ textAlign: 'center', padding: 30 }}>
                    {rls.name}
                  </h1>

                  <table key={rls.name}>
                    <tbody>
                      {rls.working
                        .entries()
                        .map(([date, workingHours], dateIndex) => {
                          return (
                            <React.Fragment key={`${date}____${dateIndex}`}>
                              {dateIndex === 0 && (
                                <tr>
                                  <td
                                    style={{
                                      width: '50px',
                                      height: '15px',
                                    }}></td>
                                  {workingHours.map((_, hoursIndex) => {
                                    return (
                                      <td
                                        key={hoursIndex}
                                        style={{
                                          width: '50px',
                                          height: '15px',
                                        }}>
                                        {normalizeHours(hoursArr[hoursIndex])}
                                      </td>
                                    );
                                  })}
                                </tr>
                              )}
                              <tr key={`${rls.name}_${date}`}>
                                {workingHours.map(
                                  ({ isWorking }, hoursIndex) => {
                                    return (
                                      <React.Fragment
                                        key={`${date}_${hoursIndex}`}>
                                        {hoursIndex === 0 && (
                                          <td
                                            style={{
                                              width: '150px',
                                              height: '30px',
                                              textAlign: 'center',
                                              textDecoration: 'underline',
                                            }}>
                                            {date}
                                          </td>
                                        )}
                                        <td
                                          style={{
                                            width: '50px',
                                            height: '15px',
                                            background: isWorking
                                              ? 'red'
                                              : 'none',
                                            border: '1px solid grey',
                                          }}></td>
                                      </React.Fragment>
                                    );
                                  }
                                )}
                              </tr>
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: 400,
          height: 1000,
          overflow: 'scroll',
        }}>
        {data.map((rls, i) => {
          console.log(rls.name);
          if (
            !rls.name ||
            rls.name === 'undefined' ||
            rls.name === 'undefined undefined'
          ) {
            return null;
          }
          return (
            <a
              key={`___${i}___${rls.name}`}
              href={`#${i}`}
              style={{
                textAlign: 'center',
                padding: 5,
                display: 'block',
              }}>
              {rls.name}
            </a>
          );
        })}
      </div>
    </div>
  );
}
