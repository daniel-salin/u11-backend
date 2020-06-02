from picamera.array import PiRGBArray
from picamera import PiCamera
import argparse
import warnings
import datetime
import imutils
import json
import time
import cv2
import os
import sys

camera = PiCamera()
camera.resolution = tuple([640,
                           480])
camera.framerate = 16
camera.vflip = True
rawCapture = PiRGBArray(camera, size=tuple([640,
                                            480]))

print("[INFO] warming up...")
sys.stdout.flush()
time.sleep(2.5)
avg = None
lastSaved = datetime.datetime.now()
motinCounter = 0

for f in camera.capture_continuous(rawCapture, format="bgr", use_video_port=True):
    frame = f.array
    timestamp = datetime.datetime.now()
    text = "Unoccupied"

    frame = imutils.resize(frame, width=500)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (21, 21), 0)

    if avg is None:
        print("[INFO] starting background model...")
        sys.stdout.flush()
        avg = gray.copy().astype("float")
        rawCapture.truncate(0)
        continue

    cv2.accumulateWeighted(gray, avg, 0.5)
    frameDelta = cv2.absdiff(gray, cv2.convertScaleAbs(avg))

    # threshold the delta image, dilate the thresholded image to fill
    # in holes, then find contours on thresholded image
    thresh = cv2.threshold(frameDelta, 5, 255,
                           cv2.THRESH_BINARY)[1]
    thresh = cv2.dilate(thresh, None, iterations=2)
    cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
                            cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
    # loop over the contours
    for c in cnts:
        # if the contour is too small, ignore it
        if cv2.contourArea(c) < 5000:
            continue
        # compute the bounding box for the contour, draw it on the frame,
        # and update the text
        (x, y, w, h) = cv2.boundingRect(c)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        text = "Occupied"
    # draw the text and timestamp on the frame
    ts = timestamp.strftime("%A %d %B %Y %I:%M:%S%p")
    cv2.putText(frame, "Room Status: {}".format(text), (10, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    cv2.putText(frame, ts, (10, frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX,
                0.35, (0, 0, 255), 1)

    # check to see if the room is occupied
    if text == "Occupied":
        # check to see if enough time has passed between uploads
        if (timestamp - lastSaved).seconds >= 3.0:
            # increment the motion counter
            motionCounter += 1
            # check to see if the number of frames with consistent motion is
            # high enough
            if motionCounter >= 8:
                # Directories are named after dates
                dirName = timestamp.strftime("%Y_%m_%d")
                fileName = timestamp.strftime("%I_%M_%S")

                if (os.path.isdir(f'./src/archive/{dirName}')):
                    cv2.imwrite(
                        f'./src/archive/{dirName}/{fileName}.jpg', frame)
                    print(
                        f'{dirName}__{fileName}.jpg__{fileName}')
                    sys.stdout.flush()
                else:
                    os.makedirs(f'./src/archive/{dirName}')
                    cv2.imwrite(
                        f'./src/archive/{dirName}/{fileName}.jpg', frame)
                    print(
                        f'{dirName}__{fileName}.jpg__{fileName}')
                    sys.stdout.flush()
                # update the last uploaded timestamp and reset the motion
                # counter
                lastSaved = timestamp
                motionCounter = 0
    # otherwise, the room is not occupied
    else:
        motionCounter = 0

    # display the security feed on the Raspi
    #cv2.imshow("Security Feed", frame)
    #key = cv2.waitKey(1) & 0xFF
    # if the `q` key is pressed, break from the lop
    # if key == ord("q"):
     #   break
    # clear the stream in preparation for the next frame
    rawCapture.truncate(0)
