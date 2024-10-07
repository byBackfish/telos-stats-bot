import DayJS from "dayjs";
import DayJSDuration from "dayjs/plugin/duration";
import DayJSRelativeTime from "dayjs/plugin/relativeTime";
DayJS.extend(DayJSDuration);
DayJS.extend(DayJSRelativeTime);

const string = "PT40H20M37.773S";

const duration = DayJS.duration(string);

// Manually format the duration
const formatted = `${duration.hours()} hours ${duration.minutes()} minutes ${duration.seconds()} seconds`;

console.log(formatted); // "40 hours 20 minutes 37.773 seconds"
