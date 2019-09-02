constexpr double	
pow10_of_2i (unsigned int n)	
{	
  return n == 1 ? 10. : pow10_of_2i (n >> 1) * pow10_of_2i (n >> 1);	
}	

static const double powers_of_10[] =	
{	
  pow10_of_2i (0x100),	
  pow10_of_2i (0x80),	
  pow10_of_2i (0x40),	
  pow10_of_2i (0x20),	
  pow10_of_2i (0x10),	
  pow10_of_2i (0x8),	
  pow10_of_2i (0x4),	
  pow10_of_2i (0x2),	
  pow10_of_2i (0x1),	
};	

/* Works only for base 10 for n < 512 */	
extern "C" double	
pow (double base, double exponent)
{
  if ((int) base != 10) return .0; /* Works only for base=10 */
  unsigned int x = exponent;
  unsigned int mask = 0x100; /* Should be same with the first element  */	
  double result = 1;	
  for (const double *power = powers_of_10; mask; ++power, mask >>= 1)
    if (mask & x) result *= *power;	
  return result;	
}