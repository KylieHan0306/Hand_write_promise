function Promise(executor) {

    this.PromiseState = 'pending';
    this.PromiseResult = null;
    this.callbacks = [];

    const self = this; 

    function res(data) {
        /**
         * Modify the state and result
         * 'this' refers to the window, so we cannot directly use 'this'
         * Check whether the state has been changed, the state of a promise can only be changed once
        */
        if(self.PromiseState !== 'pending') return;
        self.PromiseState = 'fulfilled';
        self.PromiseResult = data;
        /**
         * Call the success callback function, timing of calling the callback function when asynchronous
         * Execute the callback multiple times
        */
        setTimeout(()=>{
            self.callbacks.forEach(item => {
                item.onResolved(data);
            })
        });
    }

    function reject(data) {
        if(self.PromiseState !== 'pending') return;
        self.PromiseState = 'rejected';
        self.PromiseResult = data;
        setTimeout(()=>{
            self.callbacks.forEach(item => {
                item.onResolved(data);
            })
        });
        /* Execute the callback only once
        if(self.callback.onRejected) {
            self.callback.onRejected(data);
        }*/
    }

    try {
        // Synchronously output executor function
        executor(res, reject);
    } catch(e) {
        reject(e);
    }

}

Promise.prototype.then = function(onResolved, onRejected) {
    let self = this; 
    if(typeof onRejected !== 'function') {
        onRejected = reason => {
            throw reason;
        }
    }

    if(typeof onResolved !== 'function') {
        onResolved = value => value;
    }

    return new Promise((resolve, reject) => {

        function callback(type) {
            /**
             * If a non-promise result is returned, result will be a successful promise
             * If a promise result is returned, result will be the returned promise
            */
            try {
                let result = type(self.PromiseResult);
                if (result instanceof Promise) {
                    result.then(v => {
                        resolve(v);
                    }, r=>{
                        reject(r);
                    });
                } else {
                    resolve(result);
                }
            } catch(e) {
                reject(e);
            }
        }

        // Call the fulfilled & rejected callback functions synchronously
        if(this.PromiseState === 'fulfilled') {
            //setTimeOut makes then execute asynchronously
            setTimeout(()=>{
                callback(onResolved);
            });
        }
        if(this.PromiseState === 'rejected') {
            setTimeout(()=>{
                callback(onRejected);
            });
        }
        //Check if pending, when asynchronous save callback functions
        if(this.PromiseState === 'pending') {
            this.callbacks.push({
                onResolved: function() {
                    callback(onResolved);
                },
                onRejected: function() {
                    callback(onRejected);
                }
            });
        }
    })

}

Promise.prototype.catch = function(onRejected) {
    return this.then(undefined, onRejected);
}

Promise.resolve = function(value) {
    return new Promise((res, rej) => {
        if (value instanceof Promise) {
            value.then(v=> {
                res(v);
            }, r=>{
                rej(r);
            })
        } else {
            res(value);
        }
    });
}

Promise.reject = function(reason) {
    return new Promise((res, rej) => {
        rej(reason);
    });
}

Promise.all = function(promises) {
    return new Promise((res, rej) => {
        let count = 0; 
        let arr = [];

        for(let i = 0; i < promises.length; i++) {

            promises[i].then(v => {
                count++;
                /**
                 * There is an asynchronous situation,
                 * If you don't use 'i' to change the state first, the Promise will be placed into the array first,
                 * leading to an incorrect order
                */
                arr[i] = v;
                if(count === promises.length) {
                    res(arr);
                }
            }, r => {
                rej(r);
            })
        }
    });
}

Promise.race = function(promises) {
    return new Promise((res, rej) => {

        for(let i = 0; i < promises.length; i++) {
            promises[i].then(v => {
                res(v);
            }, r => {
                rej(r);
            })
        }
    });
}