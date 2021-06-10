import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush     // allows view to be updated with product is selected
})
export class ProductDetailComponent {
  pageTitle = 'Product Detail';
  errorMessage = '';

  product$ = this.productService.selectedProduct$     // products$ uses stream that selects a product based on user selection
    .pipe(
      catchError(err => {
        this.errorMessage = err;
        return EMPTY;
      })
    );

  constructor(private productService: ProductService) { }

}
