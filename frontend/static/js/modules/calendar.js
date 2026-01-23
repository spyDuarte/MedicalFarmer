import { Storage } from './storage.js';

export const CalendarController = {
    calendar: null,

    render() {
        if (!this.calendar) {
            const calendarEl = document.getElementById('calendar-container');
            if(!calendarEl) return;

            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'pt-br',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                buttonText: {
                    today: 'Hoje',
                    month: 'Mês',
                    week: 'Semana',
                    day: 'Dia',
                    list: 'Lista'
                },
                events: function(fetchInfo, successCallback, failureCallback) {
                    const history = Storage.getPericias();
                    const events = history
                        .filter(item => item.data_pericia) // Only items with a date
                        .map(item => ({
                            title: item.nome_autor || 'Sem Nome',
                            start: item.data_pericia,
                            url: '#editar/' + item.id,
                            color: item.status === 'Concluido' ? '#10B981' : (item.status === 'Agendado' ? '#3B82F6' : '#F59E0B')
                        }));
                    successCallback(events);
                },
                eventClick: function(info) {
                    info.jsEvent.preventDefault(); // don't let the browser navigate
                    if (info.event.url) {
                        window.location.hash = info.event.url;
                    }
                }
            });
            this.calendar.render();
        } else {
            this.calendar.refetchEvents();
            this.calendar.render();
        }
    }
};
