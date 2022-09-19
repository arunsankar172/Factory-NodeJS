import psutil
import mysql.connector
import time
import os
mydb = mysql.connector.connect(
  host="localhost",
  user="root1",
  passwd="Arun@172000",
  database="factory"
)  
while True:
	cpu=psutil.cpu_percent()
	ram=psutil.virtual_memory()[2]
	if(ram>97):
		mycursor = mydb.cursor()
		sql = "INSERT INTO server (cpu,ram) VALUES (%s, %s)"
		val = (cpu, ram)
		mycursor.execute(sql, val)
		mydb.commit()
		os.system("sudo reboot")
	print(cpu)
	print(ram)
	time.sleep(5)
