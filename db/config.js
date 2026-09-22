const dns = require('dns');
const mongoose = require('mongoose');
dns.setServers(["8.8.8.8", "1.1.1.1"]);

mongoose.connect("mongodb+srv://fatadeadebola7_db_user:nqf5gDiQMcFuvUSt@cluster0.ezsxlz0.mongodb.net/")