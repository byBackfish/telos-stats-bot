const promise = new Promise((resolve, reject) => {
    resolve('Hello, World!')

    setTimeout(() => {
        resolve('Hello, World 2!')
    }, 3000);
})

promise.then(console.log).then(console.log)
promise.then(console.log)
