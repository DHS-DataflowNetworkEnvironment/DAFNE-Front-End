import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'uniqueCentreFilter',
  pure: false
})

export class UniqueNameFilterPipe implements PipeTransform {
  
  /* Filter to remove duplicates in target Ids list */
  transform(value: any): any{
    if(value!== undefined && value!== null){
        return _.uniqBy(value, 'name');
    }
    return value;
  }
}
