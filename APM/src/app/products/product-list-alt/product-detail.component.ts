import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest, EMPTY, Subject } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { Product } from '../product';

import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush     // allows view to be updated with product is selected
})
export class ProductDetailComponent {
  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  product$ = this.productService.selectedProduct$     // products$ uses stream that selects a product based on user selection
    .pipe(
      catchError(err => {
        this.errorMessageSubject = err;
        return EMPTY;
      })
    );

  pageTitle$ = this.product$
    .pipe(
      map((p: Product) =>
      p ? `Product Detail for: ${p.productName}` : null)
    );

  productSuppliers$ = this.productService.selectedProductSuppliers$         // gets the supplier for the selected product and assigns to productSuppliers$
      .pipe(
        catchError(err => {
          this.errorMessageSubject.next(err);
          return EMPTY;
        })
      );

  vm$ = combineLatest([         // emits an array and the latest emitted item from each input stream is an element in that array
    this.product$,
    this.productSuppliers$,
    this.pageTitle$
  ])
  .pipe(
    filter(([product]) => Boolean(product)),
    map(([product, productSuppliers, pageTitle]) =>       // array destructuring for each element of each of the input streams
    ({product, productSuppliers, pageTitle}))         // define an object literal w a property for each array element
  );

  constructor(private productService: ProductService) { }

}
