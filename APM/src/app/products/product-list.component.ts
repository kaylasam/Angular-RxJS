import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest, EMPTY, Observable, Subject } from 'rxjs';
import { catchError, filter, map, startWith } from 'rxjs/operators';
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
    this.productService.productsWithAdd$,        // combining action stream w data stream
    this.categorySelectedAction$
      .pipe(
        startWith(0)      // displays all products when page firsts loads (0 is the value for the display all option); you can also just use behavior subject to set a default value like this
      )
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

  // vm$ = combineLatest([         // emits an array and the latest emitted item from each input stream is an element in that array
  //   this.products$,
  //   this.categories$
  // ])
  // .pipe(
  //   filter(([products]) => Boolean(products)),
  //   map(([products, categories]) =>       // array destructuring for each element of each of the input streams
  //   ({products, categories}))         // define an object literal w a property for each array element
  // );

  constructor(private productService: ProductService, private productCategoryService: ProductCategoryService) { }

  onAdd(): void {
    this.productService.addProduct();       // when button to add product in the UI is pressed, addProduct method is called
  }

  onSelected(categoryId: string): void {        // called each time the users selects from the drop down
    this.categorySelectedSubject.next(+categoryId);     // emits the selected category id to the stream
  }
}
