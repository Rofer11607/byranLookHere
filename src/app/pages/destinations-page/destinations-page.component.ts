import { Component, OnInit } from '@angular/core';
import { addMonths, addYears, startOfDay } from 'date-fns';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import * as interfaces from '../../../../interfaces.d';
import { fadeInOut } from '../../animations/fade-in-out';
import * as services from '../../services';
services.fixNeverReadError(interfaces);

/*****Description*****

 this allows the guest to select a destination
********************/
const lorem = `Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quae odio iste
    nihil labore quisquam blanditiis, voluptate nemo ex alias nulla repellat,
    atque id a nam, natus deleniti debitis maxime aperiam?`;
const footer = '$11';

const testCardTemplates = [
  {
    image:
      'https://www.flytap.com/-/media/Flytap/new-tap-pages/destinations/north-america/dominican-republic/punta-cana/Images-Landing-Page-Destinations-punta-cana/PUJ_PagDestino_JUN2021_HeroeBannerMobile_1024x553.jpg',
    lorem,
    destName: 'Punta Cana',
    footer,
  },
  {
    image:
      'https://i0.wp.com/bransontravel.com/wp-content/uploads/2020/09/aquarium.jpg',
    lorem,
    destName: 'Branson',
    footer,
  },
];

@Component({
  selector: 'rafa-destinations-page',
  templateUrl: './destinations-page.component.html',
  styleUrls: ['./destinations-page.component.scss'],
  animations: [fadeInOut],
})
export class DestinationsPageComponent implements OnInit {
  validate(date: Date) {
    return Math.random() > 0.9;
  }
  referenceCalendar = null as any;

  getStartYear() {
    const output = new Date();
    return output;
  }

  getEndYear() {
    const output = addYears(new Date(), 1);
    return output;
  }

  async toggleDate(picker: any, dest: any) {
    this.state.selectedDestination = dest;
    const guest = this.state.guest;
    const destString = this.state.selectedDestination.destName;
    const date = new Date().getTime();
    const calendar = await this.crm.getCalendar(
      destString,
      date,
      addMonths(date, 3).getTime(),
      guest
    );

    this.referenceCalendar = calendar;
    const flatCalendar = calendar.qualifiedDevs
      .map((d: any) => d.calendar)
      .flat();

    const firstDate = flatCalendar.find((date: any) => {
      return date.isAvailable;
    });

    if (!firstDate) {
      return Swal.fire({
        icon: 'warning',
        title: 'Sorry!',
        text: 'This destination is sold out for the next three months',
        confirmButtonColor: 'green',
      });
    }

    picker.defaultDate = new Date(firstDate.milliDate);
    picker.ngOnInit();

    this.validate = (date: Date) => {
      const processedCalendar = new Set(
        flatCalendar.reduce((acc: any, curr: any) => {
          if (curr.isAvailable === false) {
            acc.push(startOfDay(new Date(curr.milliDate)).getTime());
          }
          return acc;
        }, [])
      );
      const output =
        processedCalendar.has(startOfDay(date).getTime()) ||
        date.getTime() > addMonths(new Date(), 3).getTime() ||
        date.getTime() < new Date().getTime();
      return output;
    };
    // below here is irrelevant, for the current test
    if (this.tutorialShown) return;
    picker.toggle();
    return;
  }

  async toggleTutorialShown() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.tutorialShown = false;
  }

  async moveToNext(e: Date) {
    console.log({ calendar: this.referenceCalendar });
    const flatCalendar = this.referenceCalendar.qualifiedDevs
      .map((d: any) => d.calendar)
      .flat();

    const options = flatCalendar.filter(
      (d: any) =>
        startOfDay(new Date(d.milliDate)).getTime() === startOfDay(e).getTime()
    );
    //@ts-ignore
    const ranks = options.map((d) => d.devRank);
    const minRank = Math.min(...ranks);
    //@ts-ignore
    const selected = options.find((d) => d.devRank === minRank);
    console.log({ selectedNext: selected });
    this.state.selectedDate = selected;

    this.timeline.next();
  }

  options = [] as Array<any>;
  testOptions = [1, 1, 2, 1, 2, 1].map((c) => testCardTemplates[c - 1]);
  destinationPicked = false;
  tutorialShown = false;

  constructor(
    private state: services.StateService,
    private timeline: services.TimelineService,
    private crm: services.CrmService,
    private spinner: NgxSpinnerService
  ) {}

  onNext() {
    if (this.state.selectedDate) {
      return true;
    } else {
      this.tutorialShown = true;
      return false;
    }
  }

  async ngOnInit() {
    this.spinner.show();
    const { guest } = this.state;
    //@ts-ignore
    guest.numInParty = guest.adults + guest.children;
    const options = await this.crm.getDestinations(guest);
    this.options = options.filter((opt) => {
      return opt.qualifiedDevs.length > 0;
    });
    this.timeline.currentIndex = 2;
    this.timeline.registerCallback(this.onNext.bind(this));
    this.spinner.hide();

    if ((this.tutorialShown = false)) {
      setTimeout(() => {
        this.tutorialShown = true;
      }, 300);
    }
  }
}
