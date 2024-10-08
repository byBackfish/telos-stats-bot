import DayJS from "dayjs";
import DayJSDuration from "dayjs/plugin/duration";
import DayJSRelativeTime from "dayjs/plugin/relativeTime";
DayJS.extend(DayJSDuration);
DayJS.extend(DayJSRelativeTime);

export const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
        chunkedArr.push(array.slice(i, i + size));
    }
    return chunkedArr;
};

export const formatNumber = (num: number): string => {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

export const formatTimeToDuration = (time: string): string => {
    const duration = DayJS.duration(time);

    const days = duration.hours() / 24;
    const hours = duration.hours() % 24;

    let string = "";

    if (days > 0) {
        string += `${Math.floor(days)} days `;
    }

    if (hours > 0) {
        string += `${hours} hours `;
    }

    string += `${duration.minutes()} minutes ${Math.floor(duration.seconds())} seconds`;

    return string;
};

export const getRealmName = (id: string | undefined, titleCase = true) => {
    if (!id) return null
    const name = id?.split("realm:").slice(-1)[0].replace(/-/g, " ");
    return titleCase ? name?.replace(/\b\w/g, (l) => l.toUpperCase()) : name;
}
