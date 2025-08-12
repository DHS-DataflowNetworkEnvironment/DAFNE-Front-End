import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('token');
    if (token) {
        const access_token = (JSON.parse(token).access_token);
        if (access_token) {
            req = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${access_token}`
                }
            });
        }
    }    
    
    return next(req);
};
