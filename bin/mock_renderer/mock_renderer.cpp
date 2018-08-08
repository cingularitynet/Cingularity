// mock_renderer : render to images using random color
//

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <Windows.h>

#define FREEIMAGE_LIB
#include <freeimage.h>


// usage: 
//    -id=<val> -region=<x0;y0;x1;y1> -showProgress=<val> -progressIncrement=<val> -imgFile=<outputPath>
int main(int argc, const char* argv[])
{
    // Argument sanity check
    if (argc < 4)
    {
        printf("Usage: \n");
        printf("    -id=<val> -region=<x0;y0;x1;y1> -showProgress=<val> -progressIncrement=<val> -imgFile=<outputPath>\n\n");
        return -1;
    }

    char outputFilepath[1024];
    int region[] = {0, 0, 0, 0};
    bool verbose = false;
    int verbosePercent = 1; 
    int id = 0;

    FreeImage_Initialise(TRUE);

    for (int i = 1; i < argc; ++i)
    {
        if (strncmp(argv[i], "-id", 3) == 0)
        {
            const char *p = strchr(argv[i], '=');
            id = atoi(p + 1);
        }
        else if (strncmp(argv[i], "-region", 7) == 0)
        {
            const char *p = strchr(argv[i], '=');
            sscanf_s(p + 1, "%d;%d;%d;%d", &region[0], &region[1], &region[2], &region[3]);
        }
        else if (strncmp(argv[i], "-showProgress", 13) == 0)
        {
            const char *p = strchr(argv[i], '=');
            verbose = (atoi(p + 1) > 0);
        }
        else if (strncmp(argv[i], "-progressIncrement", 18) == 0)
        {
            const char *p = strchr(argv[i], '=');
            verbosePercent = atoi(p + 1);
        }
        else if (strncmp(argv[i], "-imgFile", 8) == 0)
        {
            const char *p = strchr(argv[i], '=');
            strcpy_s(outputFilepath, 1024, p + 1);
        }
    }

    int width  = region[2] - region[0];
    int height = region[3] - region[1];

    if (width <= 0 || height <= 0 ||
        outputFilepath[0] == 0)
    {
        printf("Usage: \n");
        printf("    -region=<x0;y0;x1;y1> -showProgress=<val> -progressIncrement=<val> -imgFile=<outputPath>\n\n");
        return -1;
    }

    // Determine the fill color.
    BYTE color[3] = { 0, 0, 0 };;
    if (id < 8) 
    {
        color[0] = (BYTE)(id + 1)* 32;
        if (color[0] > 255)
        {
            color[0] = 255;
        }
    }
    else if (id < 16)
    {
        color[1] = ((BYTE)id - 7) * 32;
        if (color[1] > 255)
        {
            color[1] = 255;
        }
    }
    else 
    {
        color[2] = ((BYTE)id - 15) * 32;
        if (color[2] > 255)
        {
            color[2] = 255;
        }
    }
    
    // Fill the image with random color.
    FIBITMAP *outputImage = FreeImage_Allocate(width, height, 24);

    for (int y = 0; y < height; ++y)
    {
        BYTE *bits = FreeImage_GetScanLine(outputImage, y);
        for (int i = 0; i < width; ++i)
        {
            bits[i * 3 + 0] = color[0]; 
            bits[i * 3 + 1] = color[1]; 
            bits[i * 3 + 2] = color[2]; 
        }
    }

    // Save the image.
    if (!FreeImage_Save(FIF_TIFF, outputImage, outputFilepath, TIFF_DEFAULT))
    {
        fprintf(stderr, "Failed to save %s.", outputFilepath);
        return -1;
    }

    if (verbose)
    {
        int steps = 100 / verbosePercent;
        for (int i = 0; i < steps; i++)
        {
            printf("Rendering image...: %d.0%%\n", i * verbosePercent);
            Sleep(500);
        }
        printf("Rendering image...: 100.0%%\n");
    }

    FreeImage_Unload(outputImage);
    
    FreeImage_DeInitialise();

    return 0;
}

