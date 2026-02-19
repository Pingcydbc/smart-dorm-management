import { valueConverter } from 'aurelia';

@valueConverter('date')
export class DateValueConverter {
    toView(value: string | Date) {
        if (!value) return '';
        return new Date(value).toLocaleDateString('th-TH');
    }
}
