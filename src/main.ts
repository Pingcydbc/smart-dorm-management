import Aurelia from 'aurelia';
import { RouterConfiguration } from '@aurelia/router';
import { MyApp } from './my-app';
import { DateValueConverter } from './resources/value-converters/date';


Aurelia
  .register(RouterConfiguration.customize({ useUrlFragmentHash: true }))
  .register(DateValueConverter)
  .app(MyApp)
  .start();