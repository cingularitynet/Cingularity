// composite.cpp : Defines the entry point for the console application.
//

#include <stdio.h>

#define FREEIMAGE_LIB
#include <freeimage.h>
#include <string.h>

// Horizontally composite all input images into one 
//
// usage: 
//    <image 1> <image 2> ... <image N> outputImage
int main(int argc, const char* argv[])
{
    if (argc < 4)
    {
        printf("Usage: \n");
        printf("    <image 1> <image 2> ... <image N> outputImage\n\n");
        return 0;
    }

    FreeImage_Initialise(TRUE);

    unsigned outputWidth = 0;
    unsigned outputHeight = 0;
    unsigned outputBPP = 0;

    FIBITMAP *inputImages[1024];
    for (int i = 1; i < argc - 1; ++i)
    {
        // Check the image format.
        FREE_IMAGE_FORMAT format = FreeImage_GetFileType(argv[i], 0);
        //if still unknown, try to guess the file format from the file extension
        if (format == FIF_UNKNOWN) 
        {
            format = FreeImage_GetFIFFromFilename(argv[i]);
        }
        if (format == FIF_UNKNOWN)
        {
            fprintf(stderr, "Unknown image format for %s.\n", argv[i]);
            return 1;
        }

        FIBITMAP *image = FreeImage_Load(format, argv[i], 0);
        if (image == NULL)
        {
            fprintf(stderr, "Failed to load image %s.\n", argv[i]);
            return 1;
        }

        inputImages[i] = image;
    
        unsigned width = FreeImage_GetWidth(image);
        unsigned height = FreeImage_GetHeight(image);

        outputWidth += width;
        if (i > 1)
        {
            if (outputHeight != height)
            {
                fprintf(stderr, "Input images should have same height.\n");
                return 1;
            }
        }
        else 
        {
            outputHeight = height;
        }

        unsigned bpp = FreeImage_GetBPP(image);
        if (bpp > outputBPP)
        {
            outputBPP = bpp;
        }
    }


    unsigned offset = 0;
    FIBITMAP *outputImage = FreeImage_Allocate(outputWidth, outputHeight, outputBPP);
    for (int i = 1; i < argc - 1; ++i)
    {
        unsigned width = FreeImage_GetWidth(inputImages[i]);
        unsigned height = FreeImage_GetHeight(inputImages[i]);

        for (unsigned y = 0; y < outputHeight; ++y)
        {
            BYTE *dstBits = FreeImage_GetScanLine(outputImage, y);            BYTE *srcBits = FreeImage_GetScanLine(inputImages[i], y);            dstBits += offset * outputBPP / 8;            memcpy(dstBits, srcBits, FreeImage_GetPitch(inputImages[i]));        }

        offset += width;
    }

    if (!FreeImage_Save(FIF_TIFF, outputImage, argv[argc - 1], TIFF_DEFAULT))
    {
        fprintf(stderr, "Failed to save %s.", argv[argc - 1]);
        return 1;
    }
    
    FreeImage_DeInitialise();

    return 0;
}

