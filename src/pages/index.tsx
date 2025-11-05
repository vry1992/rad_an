import classNames from 'classnames';
import { format, parse } from 'date-fns';

import React, {
  ChangeEvent,
  Fragment,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ReadResult, xlsxParser } from '../services/xlsx-parser';

import { FullScreenSpinner } from '../components/spinner';
import { exportTablesToPdf } from '../services/export-pdf';
import { getBackgroundByStatus } from '../utils';
import styles from './Home.module.css';

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

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ReadResult>({});
  const [displayList, setDisplaylist] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [inActiveView, setInActiveView] = useState<{ [key: string]: boolean }>(
    {}
  );

  const [pending, setPending] = useState(false);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    setData({});
    setDisplaylist({});
    setInActiveView({});

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
        const list = Object.keys(readResult).reduce((acc, curr) => {
          return { ...acc, [curr]: true };
        }, {});
        setDisplaylist(list);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let observer: IntersectionObserver | null = null;

    const initObserver = () => {
      if (!containerRef.current) return;

      observer = new IntersectionObserver(
        (entries) => {
          setInActiveView((prev) => {
            const updated = { ...prev };
            entries.forEach((entry) => {
              updated[entry.target.id] = entry.isIntersecting;
            });
            return updated;
          });
        },
        {
          root: containerRef.current,
          threshold: 0.5, // можна підлаштувати
        }
      );

      const elements = containerRef.current.querySelectorAll('h3[id]');
      elements.forEach((el) => observer!.observe(el));
    };

    // даємо React час відрендерити таблиці після setData
    const timeout = setTimeout(initObserver, 0);

    return () => {
      clearTimeout(timeout);
      if (observer) observer.disconnect();
    };
  }, [data]);

  const runExport = async () => {
    try {
      setPending(true);
      await exportTablesToPdf(styles.exportTable);
    } catch (error) {
      alert('Помилка експорту');
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      {pending && <FullScreenSpinner />}
      <div>
        <input type="file" onChange={handleFile} accept=".xlsx, .xlsm" />
        {Object.keys(data).length ? (
          <button onClick={runExport}>Експортувати в PDF</button>
        ) : null}
      </div>
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 10,
          height: '95vh',
          overflowY: 'auto',
        }}>
        <div style={{ width: '70%' }}>
          {Object.entries(data).map(([radarName, workingData]) => {
            return (
              <div
                key={radarName}
                className={classNames({
                  [styles.exportTable]: displayList[radarName],
                  [styles.hidden]: !displayList[radarName],
                })}>
                <h3 id={radarName}>{radarName}</h3>
                <table className={styles.table}>
                  <tbody>
                    {
                      <tr>
                        {hoursArr.map((hour, i) => {
                          return (
                            <React.Fragment key={hour}>
                              {i === 0 ? <td></td> : null}
                              <td className={styles.hoursCell}>
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
                                  <td className={styles.dateCell}>
                                    {normalizeDate(date)}
                                  </td>
                                ) : null}
                                <td
                                  className={styles.mainCell}
                                  style={{
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
        <ul className={styles.linkList}>
          {Object.keys(data).map((radarName, i) => {
            return (
              <Fragment key={`__li__${radarName}`}>
                {i === 0 ? (
                  <>
                    <li>
                      <button
                        type="button"
                        name={radarName}
                        onClick={() => {
                          setDisplaylist((prev) => {
                            const newData = Object.entries(prev).map(
                              ([key]) => [key, false]
                            );

                            return Object.fromEntries(newData);
                          });
                        }}>
                        Зняти всі
                      </button>
                      {'  '}
                      <button
                        type="button"
                        name={radarName}
                        onClick={() => {
                          setDisplaylist((prev) => {
                            const newData = Object.entries(prev).map(
                              ([key]) => [key, true]
                            );

                            return Object.fromEntries(newData);
                          });
                        }}>
                        Вибрати всі
                      </button>
                    </li>
                  </>
                ) : null}
                <li
                  className={classNames({
                    [styles.active]: inActiveView[radarName],
                  })}>
                  <input
                    type="checkbox"
                    name={radarName}
                    className={styles.linkCheckbox}
                    checked={displayList[radarName]}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setDisplaylist((prev) => {
                        return {
                          ...prev,
                          [e.target.name]: e.target.checked,
                        };
                      });
                    }}
                  />
                  <a href={`#${radarName}`}>{radarName}</a>
                </li>
              </Fragment>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
