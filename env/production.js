module.exports = {
  "DATABASE_URI": process.env.MONGOLAB_URI,
    	 twitter: { consumerKey: process.env.consumerKey,
				consumerSecret: process.env.consumerSecret,
				callbackUrl: process.env.callbackUrl
	}
};
