const dns = require('dns');
const mongoose = require('mongoose');
dns.setServers(["8.8.8.8", "1.1.1.1"]);

if (!process.env.MONGODB_URI) {
	throw new Error('MONGODB_URI is not configured');
}

mongoose.connect(process.env.MONGODB_URI)