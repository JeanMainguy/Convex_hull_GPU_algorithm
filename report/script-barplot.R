times = read.csv2("times.csv")

barplot(times[2:4,], beside=T,
        ylab = "Time (ms)", xlab="Image size (pixels)", names.arg=times[1,], 
        col=c("blue", "green", "red"), las=2, cex.names=0.6, cex.axis=0.8)
