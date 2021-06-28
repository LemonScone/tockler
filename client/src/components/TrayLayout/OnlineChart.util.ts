import moment from 'moment';

const clampItem = ({ beginClamp, endClamp }) => item => {
    const beginDate = Math.max(beginClamp, item.beginDate);
    const endDate = Math.min(endClamp, item.endDate);

    return { ...item, beginDate, endDate };
};

export const roundTo = start => {
    const roundToMin = 3;
    const remainder = roundToMin - (start.hour() % roundToMin);

    return moment(start).add(remainder, 'hour');
};

export enum CLOCK_MODE {
    HOURS_12 = 12,
    HOURS_24 = 24,
}

export const getQuarters = (date, mode) => {
    const startDate = roundTo(moment(date))
        .subtract(mode, 'hours')
        .set('minutes', 0)
        .set('seconds', 0);

    const quarter = mode / 4;
    return [
        startDate,
        moment(startDate).add(quarter, 'hours'),
        moment(startDate).add(quarter * 2, 'hours'),
        moment(startDate).add(quarter * 3, 'hours'),
        moment(startDate).add(quarter * 4, 'hours'),
    ];
};

export const getClampHours = ({ realDate, startHour, endHour }) => {
    let beginClamp = moment(realDate)
        .startOf('day')
        .set('hour', startHour)
        .valueOf();
    let endClamp = moment(realDate)
        .startOf('day')
        .set('hour', endHour)
        .valueOf();
    return { beginClamp, endClamp };
};

export const isBetweenHours = ({ beginClamp, endClamp }) => item => {
    return (
        moment(item.beginDate).isBetween(beginClamp, endClamp) ||
        moment(item.endDate).isBetween(beginClamp, endClamp)
    );
};

export const getOnlineTimesForChart = ({ beginClamp, endClamp, items }) => {
    const pieData: any[] = [];
    const arr: any[] = [];

    const filtered = items
        .filter(item => item.app === 'ONLINE')
        .filter(isBetweenHours({ beginClamp, endClamp }));

    if (filtered.length === 0) {
        return [];
    }

    filtered.forEach(item => {
        const clampedItem = clampItem({ beginClamp, endClamp })(item);
        const diff = moment(clampedItem.endDate).diff(moment(clampedItem.beginDate), 'minutes');
        arr.push({ ...clampedItem, diff });
    });

    let nr = 0;
    arr.forEach((item, idx) => {
        const prev = 0 !== idx ? arr[idx - 1] : null;
        const next = arr.length - 1 !== idx ? arr[idx + 1] : null;

        if (!prev) {
            const diff = moment(moment(item.beginDate)).diff(beginClamp, 'minutes');

            if (diff > 0) {
                pieData.push({
                    beginDate: beginClamp.valueOf(),
                    endDate: item.beginDate,
                    color: 'transparent',
                    diff,
                    x: nr++,
                });
            }
        }

        pieData.push({ ...item, x: nr++ });

        if (next) {
            const diff = moment(next.beginDate).diff(moment(item.endDate), 'minutes');

            if (diff > 0) {
                pieData.push({
                    beginDate: item.endDate,
                    endDate: next.beginDate,
                    color: 'transparent',
                    diff,
                    x: nr++,
                });
            }
        }

        if (!next) {
            const diff = moment(moment(endClamp)).diff(item.endDate, 'minutes');

            if (diff > 0) {
                pieData.push({
                    beginDate: item.endDate,
                    endDate: endClamp.valueOf(),
                    color: 'transparent',
                    diff,
                    x: nr++,
                });
            }
        }
    });
    console.info('pieData items', pieData);
    return pieData;
};
