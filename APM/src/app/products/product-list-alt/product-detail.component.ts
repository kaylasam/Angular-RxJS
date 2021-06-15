import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EMPTY, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush     // allows view to be updated with product is selected
})
export class ProductDetailComponent {
  pageTitle = 'Product Detail';
  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  product$ = this.productService.selectedProduct$     // products$ uses stream that selects a product based on user selection
    .pipe(
      catchError(err => {
        this.errorMessageSubject = err;
        return EMPTY;
      })
    );

  productSuppliers$ = this.productService.selectedProductSuppliers$         // gets the supplier for the selected product and assigns to productSuppliers$
      .pipe(
        catchError(err => {
          this.errorMessageSubject.next(err);
          return EMPTY;
        })
      );

  constructor(private productService: ProductService) { }

}
