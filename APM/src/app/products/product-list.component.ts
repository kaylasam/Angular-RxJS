import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest, EMPTY, Observable, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';

import { Product } from './product';
import { ProductService } from './product.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent{
  pageTitle = 'Product List';
  errorMessage = '';

  private categorySelectedSubject = new Subject<number>();      //create the action stream (private bc no other code should use this subject)
  categorySelectedAction$ = this.categorySelectedSubject.asObservable();      //expose the subject's observable

  //defining categories stream and assigning to categories observable defined in product category service
  categories$ = this.productCategoryService.productCategories$
    .pipe(
        catchError(err => {
            this.errorMessage = err;
            return EMPTY;   // returns nothing if there is an error
        })
    );

  products$ = combineLatest([       
    this.productService.productsWithCategory$,        // combining action stream w data stream
    this.categorySelectedAction$
  ])
    .pipe(     // instead of product$ observable, this observable is identical except it provides the category property
      map (([products, selectedCategoryId]) =>        // first stream emits array of products, second stream emits the selected category id when user selects from the drop down
      products.filter(product =>          // filters list of products
        selectedCategoryId ? product.categoryId === selectedCategoryId : true
      )),
    catchError(err => {           // catch and replace
      this.errorMessage = err;
      return EMPTY;               // returns observable that emits empty array
    })
  );

  constructor(private productService: ProductService, private productCategoryService: ProductCategoryService) { }

  onAdd(): void {
    console.log('Not yet implemented');
  }

  onSelected(categoryId: string): void {        // called each time the users selects from the drop down
    this.categorySelectedSubject.next(+categoryId);     // emits the selected category id to the stream
  }
}
