import { Storage } from './storage.js';
import { STATUS } from './constants.js';

/**
 * Controller for the Calendar View.
 * Wraps FullCalendar logic.
 */
export const CalendarController = {
    /** @type {Object|null} FullCalendar instance */
    calendar: null,

    /**
     * Renders or refreshes the calendar.
     */
    render() {
        // eslint-disable-next-line no-undef
        if (typeof FullCalendar === 'undefined') {
            console.error('CalendarController: FullCalendar library not loaded.');
            return;
        }

        const calendarEl = document.getElementById('calendar-container');
        if (!calendarEl) return;

        if (!this.calendar) {
            // eslint-disable-next-line no-undef
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'pt-br',
                height: '100%',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,listMonth'
                },
                buttonText: {
                    today: 'Hoje',
                    month: 'Mês',
                    week: 'Semana',
                    day: 'Dia',
                    list: 'Lista'
                },
                events: (fetchInfo, successCallback, failureCallback) => {
                    try {
                        const pericias = Storage.getPericias();
                        const events = pericias
                            .filter(p => p.dataPericia) // camelCase
                            .map(p => {
                                let color = '#F59E0B'; // Default/Pending (Yellow)
                                if (p.status === STATUS.DONE) color = '#10B981'; // Green
                                else if (p.status === STATUS.SCHEDULED) color = '#3B82F6'; // Blue
                                else if (p.status === STATUS.IN_PROGRESS) color = '#6366f1'; // Indigo

                                return {
                                    id: p.id,
                                    title: `${p.numeroProcesso || ''} - ${p.nomeAutor || 'Sem Nome'}`,
                                    start: p.dataPericia,
                                    url: '#editar/' + p.id,
                                    color: color,
                                    extendedProps: {
                                        status: p.status
                                    }
                                };
                            });
                        successCallback(events);
                    } catch (error) {
                        console.error('CalendarController: Fetch error', error);
                        if(failureCallback) failureCallback(error);
                    }
                },
                eventClick: (info) => {
                    info.jsEvent.preventDefault();
                    if (info.event.url) {
                        window.location.hash = info.event.url;
                    }
                },
                eventContent: (arg) => {
                    // Custom rendering for better visuals
                    const italic = document.createElement('i');
                    italic.className = 'fa-solid fa-gavel mr-1 text-xs';
                    const title = document.createElement('span');
                    title.innerText = arg.event.title;
                    title.className = 'text-xs font-semibold';

                    const container = document.createElement('div');
                    container.className = 'flex items-center px-1 overflow-hidden';
                    container.appendChild(italic);
                    container.appendChild(title);

                    return { domNodes: [container] };
                }
            });
            this.calendar.render();
        } else {
            this.calendar.refetchEvents();
            // Sometimes resizing breaks if hidden
            setTimeout(() => this.calendar.updateSize(), 200);
        }
    }
};
